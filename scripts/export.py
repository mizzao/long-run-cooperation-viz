#!/usr/bin/env python3
"""Export tidy datasets for 'The Resilient 40%' from the raw Mongo BSON dump.

No Mongo/Meteor required: reads final-survey/meteor/*.bson directly (paths resolved from the repo root).
Usage: python3 export.py [--src DIR] [--out DIR]
Verification against the paper's published numbers runs automatically and
fails loudly on drift.
"""
import argparse, json, os, struct, sys
from collections import defaultdict

import bson

# Repo layout: this file lives in app/scripts/, data dirs live at the repo root
# (one level above app/). Resolve them relative to THIS file so cwd doesn't matter.
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))  # app/scripts -> app -> repo root

# ---------------------------------------------------------------- constants
R, T, S, P = 5, 7, 1, 3  # payoff matrix (paper / model.py)
NUMROUNDS = 10
GAMMA = 0.818            # EWMA discount, Methods (period ~10 games)
STABLE_FROM_DAY = 7
RESILIENT_MIN_CC = 0.80
# strategy codes: 1..10 = T1..T10, 11 = CC, 0 = other, -1 = missing
CC, OTHER, MISSING = 11, 0, -1
STRAT_NAMES = {**{x: f"T{x}" for x in range(1, 11)}, CC: "CC", OTHER: "other", MISSING: "missing"}


def payoff(a, b):
    if a == 1 and b == 1: return R
    if a == 1 and b == 0: return S
    if a == 0 and b == 1: return T
    return P


def load(src, name):
    with open(os.path.join(src, name + ".bson"), "rb") as f:
        return bson.decode_all(f.read())


def prescribed(strat, rnd, partner_defected_before):
    """Action prescribed by strategy for round rnd (1-based)."""
    if strat == CC:
        return 0 if partner_defected_before else 1
    # threshold Tx: cooperate conditionally up to round x-1, defect from x
    if rnd >= strat or partner_defected_before:
        return 0
    return 1


def consistent_strats(own, partner):
    """Set of strategy codes consistent with a full game (dict round->action)."""
    out = []
    for strat in list(range(1, 11)) + [CC]:
        ok = True
        pd = False  # partner defected in an earlier round
        for rnd in range(1, NUMROUNDS + 1):
            a = own.get(rnd)
            if a is None:
                continue
            if a != prescribed(strat, rnd, pd):
                ok = False
                break
            if partner.get(rnd) == 0:
                pd = True
        if ok:
            out.append(strat)
    return out


def cc_game(own, partner):
    """Played-CC (conditional cooperation) in this game: never defected
    strictly first. Simultaneous first defection counts as provoked (choices
    are simultaneous). Reproduces the paper's n=36 resilient cooperators
    exactly, with a clean margin below the 0.8 threshold (0.77 vs 0.84)."""
    fo = min((r for r, a in own.items() if a == 0), default=None)
    fp = min((r for r, a in partner.items() if a == 0), default=None)
    if fo is None:
        return True
    return fp is not None and fo >= fp


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=os.path.join(ROOT, "final-survey", "meteor"))
    ap.add_argument("--out", default=os.path.join(ROOT, "data-export"))
    args = ap.parse_args()
    src, out = args.src, args.out
    os.makedirs(out, exist_ok=True)
    os.makedirs(os.path.join(out, "days"), exist_ok=True)

    # ------------------------------------------------------------- load raw
    batches = {b["_id"]: str(b.get("name", "")) for b in load(src, "ts.batches")}
    day_of_batch = {bid: int(n[3:]) for bid, n in batches.items()
                    if n.startswith("Day") and n[3:].isdigit()}

    exps = {}
    for e in load(src, "ts.experiments"):
        d = day_of_batch.get(e.get("batchId"))
        if d is None or not e.get("startTime"):
            continue
        exps[e["_id"]] = {"day": d, "users": e.get("users", []),
                          "start": e["startTime"], "id": e["_id"]}

    actions = defaultdict(dict)          # (gameId, userId) -> {round: 0/1}
    n_day_actions = 0
    for a in load(src, "actions"):
        g = a.get("_groupId")
        if g not in exps:
            continue
        actions[(g, a["userId"])][a["roundIndex"]] = 1 if a.get("action") == 1 else 0
        n_day_actions += 1

    # ---------------------------------------------- per-player ordered games
    by_user = defaultdict(list)
    for e in exps.values():
        for u in e["users"]:
            by_user[u].append(e)
    for u in by_user:
        by_user[u].sort(key=lambda e: e["start"])

    days_played = {u: sorted({e["day"] for e in games}) for u, games in by_user.items()}

    # completion criterion (paper: attended >=18 of 20 sessions) comes from
    # ts.assignments (attendance), not from game records: one player attended
    # 18 sessions but was matched into games on only 17.
    worker_of_user = {u["_id"]: u.get("workerId") for u in load(src, "users")}
    day_batch_ids = set(day_of_batch)
    worker_days = defaultdict(set)
    for asg in load(src, "ts.assignments"):
        if asg.get("batchId") in day_batch_ids:
            worker_days[asg.get("workerId")].add(asg["batchId"])
    completing_workers = {w for w, ds in worker_days.items() if len(ds) >= 18}
    completers = sorted([u for u in by_user
                         if worker_of_user.get(u) in completing_workers])
    assert len(completers) == 94, f"expected 94 completers, got {len(completers)}"
    comp_set = set(completers)
    pidx = {u: i for i, u in enumerate(completers)}

    # game slot within day (1..20) per user
    slot = {}                            # (userId, gameId) -> (day, slotIdx)
    for u, games in by_user.items():
        per_day = defaultdict(int)
        for e in games:
            per_day[e["day"]] += 1
            slot[(u, e["id"])] = (e["day"], per_day[e["day"]])

    # ------------------------------------------------- core aggregations
    coop_rg = defaultdict(lambda: [0, 0])      # (gameIndex1..400, round) -> [c, n]
    heartbeat = defaultdict(lambda: [0, 0])    # (day, pos1..200) -> [c, n]
    firstdef = defaultdict(lambda: defaultdict(int))  # day -> bin(1..10 | 'C') -> count
    payoff_day_user = defaultdict(lambda: [0, 0])     # (day, user) -> [payoff, rounds]
    welfare_day = defaultdict(lambda: [0, 0])         # day -> [payoff, rounds]
    overall = [0, 0]

    for gid, e in exps.items():
        us = e["users"]
        if len(us) != 2:
            continue
        a0 = actions.get((gid, us[0]), {})
        a1 = actions.get((gid, us[1]), {})
        d = e["day"]
        game_fd = None
        for u, own, opp in ((us[0], a0, a1), (us[1], a1, a0)):
            day, sl = slot[(u, gid)]
            gindex = (day - 1) * 20 + sl
            for rnd in range(1, NUMROUNDS + 1):
                act = own.get(rnd)
                if act is None:
                    continue
                overall[0] += act; overall[1] += 1
                c = coop_rg[(gindex, rnd)]; c[0] += act; c[1] += 1
                h = heartbeat[(d, (sl - 1) * 10 + rnd)]; h[0] += act; h[1] += 1
                if act == 0 and (game_fd is None or rnd < game_fd):
                    game_fd = rnd
                if opp.get(rnd) is not None:
                    pv = payoff(act, opp[rnd])
                    pu = payoff_day_user[(d, u)]; pu[0] += pv; pu[1] += 1
                    w = welfare_day[d]; w[0] += pv; w[1] += 1
        if a0 or a1:
            firstdef[d][str(game_fd) if game_fd else "C"] += 1  # per GAME (paper Fig 3): first defection by either player

    # ------------------------------------------------- strategy inference
    raster = {u: [MISSING] * 400 for u in completers}
    strat_frac_stable = {}
    weights_hist_day = defaultdict(lambda: defaultdict(int))  # day -> strat -> count

    for u in completers:
        w = defaultdict(float)
        played = {}
        for e in by_user[u]:
            gid = e["id"]
            us = e["users"]
            partner = us[0] if us[1] == u else us[1]
            own = actions.get((gid, u), {})
            opp = actions.get((gid, partner), {})
            day, sl = slot[(u, gid)]
            played[(day - 1) * 20 + sl - 1] = (own, opp)
        cc_stable, n_stable = 0, 0
        for col in range(400):
            for s in list(w):
                w[s] *= GAMMA
            if col in played:
                own, opp = played[col]
                if own:
                    cons = set(consistent_strats(own, opp))
                    cons.discard(CC)
                    if cc_game(own, opp):
                        cons.add(CC)
                    for s in (cons if cons else [OTHER]):
                        w[s] += 1.0
                    best, bw = None, -1.0
                    for s, wv in w.items():
                        if wv > bw + 1e-12:
                            best, bw = s, wv
                        elif abs(wv - bw) <= 1e-12 and best is not None:
                            if best == OTHER and s != OTHER:
                                best = s
                            elif best == CC and 1 <= s <= 10:
                                best = s
                    raster[u][col] = best
                else:
                    raster[u][col] = MISSING
            day = col // 20 + 1
            if raster[u][col] != MISSING:
                weights_hist_day[day][raster[u][col]] += 1
                if day >= STABLE_FROM_DAY:
                    n_stable += 1
                    if cc_game(*played[col]):
                        cc_stable += 1
        strat_frac_stable[u] = cc_stable / n_stable if n_stable else 0.0

    resilient = {u for u in completers if strat_frac_stable[u] >= RESILIENT_MIN_CC}

    # ------------------------------------------------- group payoffs (Fig 4c)
    payoff_groups = []
    for d in range(1, 21):
        row = {"day": d}
        for label, group in (("cc", resilient), ("threshold", comp_set - resilient)):
            vals = []
            for u in group:
                pr = payoff_day_user.get((d, u))
                if pr and pr[1]:
                    vals.append(pr[0] / pr[1])
            m = sum(vals) / len(vals) if vals else None
            se = (sum((v - m) ** 2 for v in vals) / (len(vals) - 1)) ** 0.5 / len(vals) ** 0.5 \
                if vals and len(vals) > 1 else None
            row[label] = {"mean": m, "se": se, "n": len(vals)}
        payoff_groups.append(row)

    # ------------------------------------------------------------- outputs
    def dump(name, obj):
        with open(os.path.join(out, name), "w") as f:
            json.dump(obj, f, separators=(",", ":"))

    dump("coop_by_round_game.json", {
        "gameIndex": list(range(1, 401)),
        "rounds": {str(r): [round(coop_rg[(g, r)][0] / coop_rg[(g, r)][1], 4)
                            if coop_rg[(g, r)][1] else None for g in range(1, 401)]
                   for r in range(1, 11)},
        "dayOfGame": [(g - 1) // 20 + 1 for g in range(1, 401)]})

    # ---------------------------------------- session tangle (Part 3 visual)
    # Day 1, 13:00 EDT session (starts 17:xx UTC). Matching was rolling, not
    # synchronized: games are decomposed into "waves" greedily (a new wave
    # starts when a player would repeat), which recovers exactly 20 columns
    # of 26-28 pairs - each wave ~ everyone's k-th game of the session.
    day1 = sorted([e for e in exps.values() if e["day"] == 1 and len(e["users"]) == 2],
                  key=lambda e: (e["start"], str(e["id"])))
    sess1 = [e for e in day1 if e["start"].hour < 18]
    users1 = sorted({u for e in sess1 for u in e["users"]})
    lidx = {u: i for i, u in enumerate(users1)}
    waves = [[]]
    inwave = set()
    for e in sess1:
        a, b = e["users"]
        if a in inwave or b in inwave:
            waves.append([])
            inwave = set()
        waves[-1].append(e)
        inwave.update(e["users"])
    tangle_games = []
    n_null = n_cell = 0
    for wi, wave in enumerate(waves):
        pairs = []
        for e in wave:
            a, b = e["users"]
            am, bm = actions.get((e["id"], a), {}), actions.get((e["id"], b), {})
            ca = [am.get(r) for r in range(1, 11)]
            cb = [bm.get(r) for r in range(1, 11)]
            n_cell += 20
            n_null += sum(1 for v in ca + cb if v is None)
            pairs.append({"a": lidx[a], "b": lidx[b], "ca": ca, "cb": cb})
        tangle_games.append({"slot": wi + 1, "pairs": pairs})
    dump("session_tangle.json", {"nPlayers": len(users1), "session": 1, "day": 1,
                                 "games": tangle_games})

    dump("day_heartbeat.json", {
        str(d): [round(heartbeat[(d, p)][0] / heartbeat[(d, p)][1], 4)
                 if heartbeat[(d, p)][1] else None for p in range(1, 201)]
        for d in range(1, 21)})

    dump("first_defection_by_day.json", {
        str(d): {k: firstdef[d].get(k, 0) for k in [str(x) for x in range(1, 11)] + ["C"]}
        for d in range(1, 21)})

    order = sorted(completers, key=lambda u: -strat_frac_stable[u])
    dump("strategy_raster.json", {
        "codes": STRAT_NAMES,
        "players": [{"idx": pidx[u], "ccFracStable": round(strat_frac_stable[u], 4),
                     "resilient": u in resilient} for u in order],
        "rows": [raster[u] for u in order]})

    dump("strategy_distribution_by_day.json", {
        str(d): {STRAT_NAMES[s]: n for s, n in sorted(weights_hist_day[d].items())}
        for d in range(1, 21)})

    dump("payoffs_by_group_day.json", payoff_groups)

    mean_pr = sum(w[0] for w in welfare_day.values()) / sum(w[1] for w in welfare_day.values())
    dump("welfare.json", {
        "overallCoopRate": round(overall[0] / overall[1], 4),
        "byDay": {str(d): round((welfare_day[d][0] / welfare_day[d][1] - P) / (R - P), 4)
                  for d in range(1, 21) if welfare_day[d][1]},
        # paper's normalization: share of the way from all-defect (P) to all-cooperate (R)
        "overallWelfare": round((mean_pr - P) / (R - P), 4),
        "meanPayoffPerRound": round(mean_pr, 4)})

    dump("player_summary.json", [
        {"idx": pidx[u], "resilient": u in resilient,
         "ccFracStable": round(strat_frac_stable[u], 4),
         "daysPlayed": len(days_played[u]),
         "decisions": sum(len(actions.get((e['id'], u), {})) for e in by_user[u])}
        for u in completers])

    # packed decision buffer: playerIdx u8, day u8, gameInDay u8, round u8, action u8
    buf = bytearray()
    n_packed = 0
    for u in completers:
        for e in by_user[u]:
            gid = e["id"]
            day, sl = slot[(u, gid)]
            for rnd, act in sorted(actions.get((gid, u), {}).items()):
                buf += struct.pack("5B", pidx[u], day, sl, rnd, act)
                n_packed += 1
    with open(os.path.join(out, "decisions.bin"), "wb") as f:
        f.write(buf)
    dump("decisions_meta.json", {"fields": ["playerIdx", "day", "gameInDay", "round", "action"],
                                 "dtype": "u8", "count": n_packed})

    # Andrew's vizJson schema, per day
    for d in range(1, 21):
        games_d, links, users_d = [], [], set()
        by_user_day = defaultdict(list)
        for gid, e in exps.items():
            if e["day"] != d:
                continue
            games_d.append({"_id": gid, "users": e["users"],
                            "startTime": e["start"].isoformat()})
            for u in e["users"]:
                users_d.add(u)
                by_user_day[u].append(e)
        acts = []
        for e in [g for g in exps.values() if g["day"] == d]:
            for u in e["users"]:
                for rnd, act in sorted(actions.get((e["id"], u), {}).items()):
                    acts.append({"userId": u, "_groupId": e["id"],
                                 "roundIndex": rnd, "action": act})
        for u, gs in by_user_day.items():
            gs.sort(key=lambda e: e["start"])
            for x in range(1, len(gs)):
                links.append({"userId": u, "source": gs[x - 1]["id"], "target": gs[x]["id"]})
        with open(os.path.join(out, "days", f"day{d}.json"), "w") as f:
            json.dump({"id": f"Day{d}", "numMatchings": max(len(g) for g in
                       [[e for e in exps.values() if e['day'] == d]]),
                       "userIds": sorted(users_d), "games": games_d,
                       "actions": acts, "links": links}, f, separators=(",", ":"))

    # ------------------------------------------------------------- verify
    checks = []
    def chk(name, cond, detail=""):
        checks.append((name, bool(cond), detail))

    chk("tangle: 56 players session 1 day 1", len(users1) == 56, str(len(users1)))
    chk("tangle: 20 waves", len(tangle_games) == 20, str(len(tangle_games)))
    chk("tangle: 26-28 pairs per wave", all(26 <= len(g["pairs"]) <= 28 for g in tangle_games),
        str([len(g["pairs"]) for g in tangle_games]))
    chk("tangle: no player twice in a wave",
        all(len({x for pr in g["pairs"] for x in (pr["a"], pr["b"])}) == 2 * len(g["pairs"])
            for g in tangle_games))
    chk("tangle: missing cells <2%", n_null / n_cell < 0.02, f"{n_null}/{n_cell}")

    ov = overall[0] / overall[1]
    d1r1 = coop_rg[(1, 1)]
    d1r1_avg = sum(coop_rg[(g, 1)][0] for g in range(1, 21)) / \
               max(1, sum(coop_rg[(g, 1)][1] for g in range(1, 21)))
    r10_d1 = sum(coop_rg[(g, 10)][0] for g in range(1, 21)) / \
             max(1, sum(coop_rg[(g, 10)][1] for g in range(1, 21)))
    r10_d20 = sum(coop_rg[(g, 10)][0] for g in range(381, 401)) / \
              max(1, sum(coop_rg[(g, 10)][1] for g in range(381, 401)))
    ccC = [sum(1 for d in range(1, 21) if firstdef[d].get("C", 0) /
               max(1, sum(firstdef[d].values())) > 0.13)]
    chk("94 completers", len(completers) == 94, str(len(completers)))
    chk("~374k decisions (Day1-20)", abs(n_day_actions - 374263) < 500, f"{n_day_actions:,}")
    chk("overall cooperation ~84%", 0.83 < ov < 0.86, f"{ov:.1%}")
    chk("day-1 round-1 cooperation >80%", d1r1_avg > 0.80, f"{d1r1_avg:.1%}")
    chk("round-10 unravels (day1 vs day20)", r10_d1 - r10_d20 > 0.15,
        f"{r10_d1:.0%} -> {r10_d20:.0%}")
    chk("resilient cooperators == 36", len(resilient) == 36, str(len(resilient)))
    cfr = [firstdef[d].get("C", 0) / max(1, sum(firstdef[d].values())) for d in range(1, 21)]
    chk("fully-coop games 10-35% every day", all(0.10 < f < 0.35 for f in cfr),
        f"min {min(cfr):.0%} max {max(cfr):.0%}")
    chk("fully-coop games 12-22% in stable phase", all(0.12 < f < 0.22 for f in cfr[6:]),
        f"stable min {min(cfr[6:]):.0%} max {max(cfr[6:]):.0%}")
    gaps = [r["threshold"]["mean"] - r["cc"]["mean"] for r in payoff_groups]
    gap_d1 = abs(gaps[0])
    mean_stable_gap = sum(gaps[6:]) / len(gaps[6:])
    chk("payoff gap ~0 on day 1", gap_d1 < 0.08, f"{gap_d1:.3f}")
    chk("threshold > CC every day 2-20", all(g > 0 for g in gaps[1:]),
        f"min {min(gaps[1:]):+.3f}")
    chk("mean stable-phase gap > 0.05", mean_stable_gap > 0.05,
        f"{mean_stable_gap:.3f}")
    wnorm = (mean_pr - P) / (R - P)
    chk("normalized welfare ~84% (paper)", 0.82 < wnorm < 0.86, f"{wnorm:.1%}")

    width = max(len(c[0]) for c in checks)
    ok = True
    for name, passed, detail in checks:
        print(f"{'PASS' if passed else 'FAIL'}  {name:<{width}}  {detail}")
        ok &= passed
    sizes = {f: os.path.getsize(os.path.join(out, f)) for f in sorted(os.listdir(out))
             if os.path.isfile(os.path.join(out, f))}
    print("\nOutputs:")
    for f, s in sizes.items():
        print(f"  {f:<38} {s/1024:8.1f} KB")
    daydir = os.path.join(out, "days")
    dtot = sum(os.path.getsize(os.path.join(daydir, x)) for x in os.listdir(daydir))
    print(f"  days/day1..20.json                     {dtot/1024:8.1f} KB total")
    if not ok:
        sys.exit(1)
    print("\nAll checks passed.")


if __name__ == "__main__":
    main()
