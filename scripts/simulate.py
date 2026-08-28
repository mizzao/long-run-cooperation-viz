#!/usr/bin/env python3
"""Agent-based simulation of the paper's learning model (smoothed fictitious play).
Validates against Figs 5-6 and exports datasets for the Part-8 scene.

Provenance - Mao, Dworkin, Suri & Watts 2017 (Nature Comms 8:13800), Methods
section "Modelling player behaviour":
  * Strategy set = ONLY the 11 threshold strategies Tx (T1=ALLD .. T10, CC),
    "which account for the vast majority of observed human actions". No TFT/STFT.
  * Tx = conditional cooperation up to round x, then unilateral defection;
    CC = full conditional cooperation (grim trigger).  -> see genU()
  * Payoffs R,T,S,P = 5,7,1,3 (paper Table 1; identical to reference-repo/model.py).
  * Rational agents keep belief counts of opponents' strategies -> expected utility
    u(s)=P.p -> softmax choice prob ~ exp(u(s)/b), with b=0.005 (Fig 6 / Suppl Fig 10).
  * Resilient cooperators unconditionally play CC.
NOTE: reference-repo/model.py is an earlier exploratory artifact (13 strategies -
  unconditional thresholds + TFT + STFT) that contradicts the published Methods
  ("only the threshold strategies"); we follow the paper. Only its R/T/S/P match."""
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))  # app/scripts -> app -> repo root

R, T, S, P_ = 5, 7, 1, 3          # paper Table 1 (== reference-repo/model.py PAYOFFS)
NR, N, NS = 10, 100, 11           # 10 rounds; N=100 agents (paper Fig 5); 11 threshold strategies
BETA = 0.005                      # softmax temperature b (paper Fig 6: b=0.005)
DELTA = 0.99                      # belief recency; paper's sim uses cumulative opponent-strategy
                                  # counts (its g=0.818 EWMA is for the Fig-4 classification, not the sim)
CC = 10                           # index of the grim-trigger CC strategy

def pay(a, b):
    if a and b: return R
    if a and not b: return S
    if not a and b: return T
    return P_

def genU():
    # Paper Methods: Tx conditionally cooperates up to round x then defects
    # unilaterally; CC = grim trigger (cooperate until defected on). Encoded as:
    # cooperate in round r iff r < threshold[i] AND not yet defected-upon (CC = threshold 11).
    thresh = [s + 1 for s in range(10)] + [NR + 1]
    U = np.zeros((NS, NS))
    for i in range(NS):
        for j in range(NS):
            pi = pj = False  # provoked flags
            ui = 0
            for r in range(1, NR + 1):
                a = (r < thresh[i]) and not pi
                b = (r < thresh[j]) and not pj
                ui += pay(a, b)
                if not b: pi = True
                if not a: pj = True
            U[i, j] = ui
    return U

PM = genU()

def run(alpha, games, seed):
    rng = np.random.default_rng(seed)
    n_res = int(round(alpha * N))
    res = np.zeros(N, bool); res[:n_res] = True
    counts = np.full((N, NS), 0.2); counts[:, CC] = 5.0  # cooperative initial beliefs
    shares = np.zeros((games, NS))
    strat = np.full(N, CC)
    for g in range(games):
        p = counts / counts.sum(1, keepdims=True)
        U = p @ PM.T
        z = (U - U.max(1, keepdims=True)) / BETA
        w = np.exp(z); w /= w.sum(1, keepdims=True)
        pick = (w.cumsum(1) > rng.random((N, 1))).argmax(1)
        strat = np.where(res, CC, pick)
        order = rng.permutation(N)
        opp = np.empty(N, int)
        opp[order[0::2]] = strat[order[1::2]]
        opp[order[1::2]] = strat[order[0::2]]
        counts *= DELTA
        counts[np.arange(N), opp] += 1
        shares[g] = np.bincount(strat, minlength=NS) / N
    return shares, strat, res

def rd_of(s):  # first-defection round of strategy index; CC -> 10 (cap, matches r_inf<=10)
    return np.where(s >= 9, 10, s + 1)

def welfare(alpha, games, seed):
    rng = np.random.default_rng(seed)
    n_res = int(round(alpha * N))
    res = np.zeros(N, bool); res[:n_res] = True
    counts = np.full((N, NS), 0.2); counts[:, CC] = 5.0
    tot = np.zeros(N); nr = 0
    last = games // 5
    for g in range(games):
        p = counts / counts.sum(1, keepdims=True)
        U = p @ PM.T
        z = (U - U.max(1, keepdims=True)) / BETA
        w = np.exp(z); w /= w.sum(1, keepdims=True)
        pick = (w.cumsum(1) > rng.random((N, 1))).argmax(1)
        strat = np.where(res, CC, pick)
        order = rng.permutation(N)
        opp = np.empty(N, int)
        opp[order[0::2]] = strat[order[1::2]]
        opp[order[1::2]] = strat[order[0::2]]
        counts *= DELTA
        counts[np.arange(N), opp] += 1
        if g >= games - last:
            tot += PM[strat, opp] / NR
            nr += 1
    per = tot / nr
    out = {"all": float(per.mean()), "rational": float(per[~res].mean())}
    if n_res: out["resilient"] = float(per[res].mean())
    return out

def main():
    checks = []
    def chk(name, cond, detail=""):
        checks.append((name, bool(cond), detail)); print(("PASS " if cond else "FAIL "), name, detail)

    sh0, _, _ = run(0.0, 400, 1)
    sh4, strat4, res4 = run(0.4, 400, 1)
    sh4L, strat4L, res4L = run(0.4, 4000, 2)

    late0 = sh0[300:].mean(0)
    chk("alpha=0 unravels (T1+T2 late share > 0.6)", late0[0] + late0[1] > 0.6, f"{late0[0]+late0[1]:.2f}")
    late4 = sh4[300:].mean(0)
    chk("alpha=0.4 CC share ~0.4", 0.38 < late4[CC] < 0.42, f"{late4[CC]:.2f}")
    rat_late = late4[:CC]
    modal = int(rat_late.argmax())
    chk("alpha=0.4 modal rational in T8..T10", modal in (7, 8, 9), f"T{modal+1}")
    l1 = sh4L[900:1100, 7:10].sum(); l2 = sh4L[3800:4000, 7:10].sum()
    chk("alpha=0.4 stable to 4000 games (10x experiment)", abs(l1 - l2) / max(l1, 1e-9) < 0.15, f"{l1:.1f} vs {l2:.1f}")

    alphas = np.round(np.linspace(0, 1, 21), 2)
    phase = []
    for a in alphas:
        rs = []
        for sd in range(5):
            sh, strat, res = run(float(a), 2000, 100 + sd)
            if (~res).any():
                sh_l, strat_l = sh, strat
                # average rd of rational agents over last 200 games via re-run tracking? use final strat sample x share method:
                lateshare = sh[1800:].mean(0)
                rat_share = lateshare.copy()
                if a > 0:
                    rat_share[CC] = max(0.0, rat_share[CC] - a)  # remove resilient block
                tot = rat_share.sum()
                rd = float((rd_of(np.arange(NS)) * rat_share).sum() / tot) if tot > 1e-9 else 10.0
            else:
                rd = 10.0
            rs.append(rd)
        phase.append({"alpha": float(a), "r": float(np.mean(rs)), "se": float(np.std(rs) / np.sqrt(len(rs)))})
    r0 = phase[0]["r"]; r4 = [p for p in phase if abs(p["alpha"] - 0.4) < 1e-9][0]["r"]; r1 = phase[-1]["r"]
    chk("phase r(0) <= 2.5", r0 <= 2.5, f"{r0:.2f}")
    chk("phase r(0.4) in [7, 9.5]", 7 <= r4 <= 9.5, f"{r4:.2f}")
    chk("phase r(1) >= 9", r1 >= 9, f"{r1:.2f}")

    w0 = welfare(0.0, 2000, 11)
    w4 = welfare(0.4, 2000, 12)
    chk("welfare all: a40 > a0", w4["all"] > w0["all"], f"{w4['all']:.2f} vs {w0['all']:.2f}")
    chk("welfare rational: a40 > a0", w4["rational"] > w0["rational"], f"{w4['rational']:.2f} vs {w0['rational']:.2f}")

    fd = json.load(open(os.path.join(ROOT, "data-export", "first_defection_by_day.json")))
    num = den = 0
    for d in range(7, 21):
        for k, n in fd[str(d)].items():
            rdv = 10 if k == "C" else int(k)
            num += rdv * n; den += n
    remp = num / den
    chk("empirical stable-phase mean rd (C->10) in [7.5, 9]", 7.5 < remp < 9, f"{remp:.2f}")

    if not all(c[1] for c in checks):
        sys.exit(1)

    out = {
        "meta": {"N": N, "beta": BETA, "strategies": [f"T{i+1}" for i in range(10)] + ["CC"]},
        "sharesAlpha0": np.round(sh0, 4).tolist(),
        "sharesAlpha40": np.round(sh4, 4).tolist(),
        "phase": phase,
        "welfare": {"a0": w0, "a40": w4},
        "experiment": {"alpha": 0.4, "r": round(remp, 2)}
    }
    with open(os.path.join(ROOT, "data-export", "simulation.json"), "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print("\nwrote simulation.json,", len(json.dumps(out)) // 1024, "KB. All checks passed.")

if __name__ == "__main__":
    main()
