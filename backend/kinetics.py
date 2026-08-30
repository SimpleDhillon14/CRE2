"""
Core reaction-kinetics fitting logic.

For every integer order 0..max_order, the integrated rate law is fit
DIRECTLY to the raw (t, C) data with scipy.optimize.curve_fit (nonlinear
least squares) -- not by linearizing the data first. The order whose fit
gives the highest R^2 is reported as the predicted reaction order.
"""
import numpy as np
from scipy.optimize import curve_fit

EPS = 1e-12


def _model(t, k, C0, n):
    """Integrated rate law C(t) for a given order n (k, C0 are fit params)."""
    t = np.asarray(t, dtype=float)
    if n == 0:
        # C(t) = C0 - k t   (clip so concentration can't go negative)
        return np.clip(C0 - k * t, 0.0, None)
    if n == 1:
        # C(t) = C0 * exp(-k t)
        return C0 * np.exp(-k * t)
    # General n != 1: C(t) = [C0^(1-n) + (n-1) k t]^(1/(1-n))
    base = np.power(max(C0, EPS), 1 - n) + (n - 1) * k * t
    base = np.clip(base, EPS, None)  # keep the base positive -> avoid NaN/Inf
    return np.power(base, 1.0 / (1.0 - n))


def _equation_str(order):
    if order == 0:
        return "C(t) = C0 - k*t"
    if order == 1:
        return "C(t) = C0 * exp(-k*t)"
    return f"C(t) = [C0^(1-{order}) + ({order}-1)*k*t]^(1/(1-{order}))"


def _k_unit(order, conc_unit, time_unit):
    if order == 0:
        return f"{conc_unit}/{time_unit}"
    if order == 1:
        return f"1/{time_unit}"
    return f"{conc_unit}^-{order - 1}/{time_unit}"


def _y_label_for_linearization(order):
    """Label for the linearized y-axis variable used to determine this order."""
    if order == 0:
        return "C"
    if order == 1:
        return "ln(C)"
    if order == 2:
        return "1/C"
    exp = order - 1
    superscripts = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")
    return f"1/C{str(exp).translate(superscripts)}"


def _transform_C(C, order):
    """Transform concentration values for the linearized diagnostic plot."""
    C = np.asarray(C, dtype=float)
    if order == 0:
        return C
    if order == 1:
        C_safe = np.clip(C, EPS, None)
        return np.log(C_safe)
    C_safe = np.clip(C, EPS, None)
    return np.power(C_safe, 1 - order)


def _initial_guess(t, C, order):
    C0_guess = max(float(C[0]), EPS)
    t_range = max(float(np.max(t)), EPS)
    C_range = max(C0_guess - float(np.min(C)), EPS)
    if order == 0:
        k_guess = C_range / t_range
    elif order == 1:
        k_guess = 1.0 / t_range
    else:
        k_guess = 1.0 / (t_range * C0_guess ** max(order - 1, 1))
    k_guess = k_guess if np.isfinite(k_guess) and k_guess > 0 else 0.01
    return [k_guess, C0_guess]


def fit_all_orders(t_list, C_list, max_order):
    """Fit orders 0..max_order and return results sorted for reporting."""
    t = np.asarray(t_list, dtype=float)
    C = np.asarray(C_list, dtype=float)
    C_bar = np.mean(C)
    ss_tot = np.sum((C - C_bar) ** 2)
    ss_tot = ss_tot if ss_tot > EPS else EPS

    results = []
    for order in range(0, max_order + 1):
        p0 = _initial_guess(t, C, order)
        try:
            def model_func(tt, k, C0, _n=order):
                return _model(tt, k, C0, _n)

            popt, _ = curve_fit(
                model_func, t, C, p0=p0,
                bounds=([0.0, EPS], [np.inf, np.inf]),
                maxfev=20000,
            )
            k_fit, C0_fit = float(popt[0]), float(popt[1])
            C_pred = model_func(t, k_fit, C0_fit)
            if not np.all(np.isfinite(C_pred)):
                raise ValueError("Non-finite prediction")
            ss_res = float(np.sum((C - C_pred) ** 2))
            r2 = 1.0 - ss_res / ss_tot
            results.append({
                "order": order, "k": k_fit, "C0": C0_fit, "r2": r2,
                "status": "OK",
            })
        except Exception:
            results.append({
                "order": order, "k": None, "C0": None, "r2": None,
                "status": "Fit failed",
            })
    return results


def build_response(t_list, C_list, max_order, time_unit, concentration_unit):
    results = fit_all_orders(t_list, C_list, max_order)

    valid = [r for r in results if r["status"] == "OK"]
    if not valid:
        raise ValueError("Could not fit any reaction order to this data.")

    best = max(valid, key=lambda r: r["r2"])
    best_order = best["order"]
    best_k = best["k"]
    best_C0 = best["C0"]
    best_r2 = best["r2"]

    for r in results:
        r["k_unit"] = _k_unit(r["order"], concentration_unit, time_unit)

    t = np.asarray(t_list, dtype=float)
    C = np.asarray(C_list, dtype=float)

    # smooth best-fit curve for the C vs t chart
    t_smooth = np.linspace(float(np.min(t)), float(np.max(t)), 200)
    C_smooth = _model(t_smooth, best_k, best_C0, best_order)

    # linearized diagnostic plot for the predicted order only
    y_label = _y_label_for_linearization(best_order)
    y_points = _transform_C(C, best_order)
    points = [[float(tt), float(yy)] for tt, yy in zip(t, y_points) if np.isfinite(yy)]

    t0, t1 = float(np.min(t)), float(np.max(t))
    if best_order == 0:
        slope, intercept = -best_k, best_C0
    elif best_order == 1:
        slope, intercept = -best_k, np.log(max(best_C0, EPS))
    else:
        slope, intercept = (best_order - 1) * best_k, best_C0 ** (1 - best_order)
    fit_line = [[t0, slope * t0 + intercept], [t1, slope * t1 + intercept]]

    return {
        "best_order": best_order,
        "best_k": best_k,
        "best_C0": best_C0,
        "best_r2": best_r2,
        "best_k_unit": _k_unit(best_order, concentration_unit, time_unit),
        "equation": _equation_str(best_order),
        "results": results,
        "experimental": {"time": t.tolist(), "concentration": C.tolist()},
        "best_fit_curve": {"time": t_smooth.tolist(), "concentration": C_smooth.tolist()},
        "linearized": {
            "x_label": f"Time, t ({time_unit})",
            "y_label": f"{y_label}" + (f" ({concentration_unit})" if best_order == 0 else ""),
            "points": points,
            "fit_line": fit_line,
            "slope": float(slope),
            "intercept": float(intercept),
        },
        "time_unit": time_unit,
        "concentration_unit": concentration_unit,
    }
