/* @ds-bundle: {"format":3,"namespace":"ControlAIAdsDesignSystem_ca8c6d","components":[{"name":"CtaButton","sourcePath":"components/brand/CtaButton.jsx"},{"name":"LogoMark","sourcePath":"components/brand/LogoMark.jsx"},{"name":"AdCanvas","sourcePath":"components/layout/AdCanvas.jsx"},{"name":"EditorialHeadline","sourcePath":"components/typography/EditorialHeadline.jsx"},{"name":"Eyebrow","sourcePath":"components/typography/Eyebrow.jsx"},{"name":"PosterHeadline","sourcePath":"components/typography/PosterHeadline.jsx"}],"sourceHashes":{"components/brand/CtaButton.jsx":"2b08990a0608","components/brand/LogoMark.jsx":"a915e2417cc2","components/layout/AdCanvas.jsx":"089f7bd620f0","components/typography/EditorialHeadline.jsx":"73cef7caeb0a","components/typography/Eyebrow.jsx":"22368fe2db87","components/typography/PosterHeadline.jsx":"8e284204e1a5","ui_kits/ad-creatives/AdPresets.jsx":"b87e7dd4b5dd"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ControlAIAdsDesignSystem_ca8c6d = window.ControlAIAdsDesignSystem_ca8c6d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/CtaButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ControlAI call-to-action button.
 * Two brand-sanctioned shapes:
 *  - "pill": rounded mint capsule used on the calmer editorial ads
 *    ("Sign for Control", "Take Action").
 *  - "parallelogram": skewed mint block used on the bold vintage posters.
 * Always mint ground + black uppercase label.
 */
function CtaButton({
  children = "Take Action",
  variant = "pill",
  size = "md",
  as = "button",
  href,
  onClick,
  style,
  ...rest
}) {
  const pad = size === "lg" ? "20px 44px" : size === "sm" ? "10px 22px" : "16px 34px";
  const fs = size === "lg" ? "26px" : size === "sm" ? "16px" : "21px";
  const base = {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "var(--ls-cta)",
    fontSize: fs,
    lineHeight: 1,
    color: "var(--cta-text)",
    background: "var(--cta-bg)",
    border: "none",
    cursor: "pointer",
    display: "inline-block",
    textDecoration: "none",
    padding: pad,
    transition: "transform var(--dur-fast) var(--ease-snap), background var(--dur) var(--ease-out)",
    WebkitTapHighlightColor: "transparent"
  };
  const shape = variant === "parallelogram" ? {
    transform: "skewX(-12deg)",
    borderRadius: 0
  } : {
    borderRadius: "var(--r-pill)"
  };
  const Tag = href ? "a" : as;
  const inner = variant === "parallelogram" ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      transform: "skewX(12deg)"
    }
  }, children) : children;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    onClick: onClick,
    style: {
      ...base,
      ...shape,
      ...style
    },
    onMouseDown: e => e.currentTarget.style.transform = `${variant === "parallelogram" ? "skewX(-12deg) " : ""}scale(0.96)`,
    onMouseUp: e => e.currentTarget.style.transform = variant === "parallelogram" ? "skewX(-12deg)" : "none",
    onMouseLeave: e => e.currentTarget.style.transform = variant === "parallelogram" ? "skewX(-12deg)" : "none"
  }, rest), inner);
}
Object.assign(__ds_scope, { CtaButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/CtaButton.jsx", error: String((e && e.message) || e) }); }

// components/brand/LogoMark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ControlAI brandmark lockup, drawn in CSS (no asset dependency).
 * The signature is a hard rectangular frame around the "CONTROL/AI" wordmark
 * with a small mint tick tab on the right edge.
 *
 * tones:
 *  - "mint":  mint frame + tick, white wordmark (on dark/poster grounds)
 *  - "dark":  black frame + tick, black wordmark (on light grounds)
 *  - "light": white frame + tick, white wordmark (on photos)
 */
function LogoMark({
  tone = "mint",
  text = "CONTROL/AI",
  size = 18,
  style,
  ...rest
}) {
  const palette = {
    mint: {
      line: "var(--mint)",
      ink: "var(--white)",
      tick: "var(--mint)"
    },
    dark: {
      line: "var(--black)",
      ink: "var(--black)",
      tick: "var(--black)"
    },
    light: {
      line: "var(--white)",
      ink: "var(--white)",
      tick: "var(--white)"
    }
  }[tone];
  const tick = Math.round(size * 0.62);
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "stretch",
      fontFamily: "var(--font-display)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      border: `${Math.max(2, Math.round(size / 7))}px solid ${palette.line}`,
      color: palette.ink,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: "0.01em",
      padding: `${Math.round(size * 0.34)}px ${Math.round(size * 0.5)}px`,
      display: "inline-flex",
      alignItems: "center"
    }
  }, text), /*#__PURE__*/React.createElement("span", {
    style: {
      width: tick,
      background: palette.tick,
      alignSelf: "center",
      height: tick,
      marginLeft: Math.round(size * 0.16)
    }
  }));
}
Object.assign(__ds_scope, { LogoMark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/LogoMark.jsx", error: String((e && e.message) || e) }); }

// components/layout/AdCanvas.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * AdCanvas — the fixed-ratio creative frame ControlAI ships ads in.
 * Handles the two delivery formats and the brand grounds.
 *
 * format: "square" (1:1, feeds) | "vertical" (9:16, stories) | "wide" (16:9)
 * ground: "halftone" (black dot weave) | "black" | "ink" | "terracotta" | "white" | "none"
 *
 * The frame is a fixed-pixel artboard; scale it with the `scale` prop or wrap
 * it in your own transform. Content is padded by --ad-margin by default.
 */
function AdCanvas({
  children,
  format = "square",
  ground = "halftone",
  scale = 1,
  pad = true,
  style,
  className = "",
  ...rest
}) {
  const dims = {
    square: {
      w: 1080,
      h: 1080
    },
    vertical: {
      w: 1080,
      h: 1920
    },
    wide: {
      w: 1920,
      h: 1080
    }
  }[format];
  const groundClass = ground === "halftone" ? "cai-halftone" : ground === "terracotta" ? "cai-grain" : "";
  const bg = {
    black: "var(--black)",
    ink: "var(--ink)",
    terracotta: "var(--terracotta)",
    white: "var(--white)",
    none: "transparent",
    halftone: undefined
  }[ground];
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `${groundClass} ${className}`.trim(),
    style: {
      width: dims.w,
      height: dims.h,
      background: bg,
      position: "relative",
      overflow: "hidden",
      boxSizing: "border-box",
      padding: pad ? "var(--ad-margin)" : 0,
      transform: scale !== 1 ? `scale(${scale})` : undefined,
      transformOrigin: "top left",
      fontFamily: "var(--font-body)",
      color: "var(--text-primary)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { AdCanvas });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/AdCanvas.jsx", error: String((e && e.message) || e) }); }

// components/typography/EditorialHeadline.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Editorial headline — the calmer ControlAI voice used on black-ground ads.
 * Neue Haas Bold, title-case, tight tracking. Optional marker-stroke highlight
 * (the smudged dark bar seen behind "in control?").
 */
function EditorialHeadline({
  children,
  size = "h1",
  tone = "white",
  marker = false,
  as = "h2",
  style,
  ...rest
}) {
  const fs = {
    hero: "var(--fs-hero)",
    h1: "var(--fs-h1)",
    h2: "var(--fs-h2)",
    h3: "var(--fs-h3)",
    lead: "var(--fs-lead)"
  }[size] || size;
  const color = tone === "mint" ? "var(--mint)" : tone === "ink" ? "var(--black)" : "var(--white)";
  const markerStyle = marker ? {
    background: "var(--marker-ink)",
    boxShadow: "0.18em 0 0 var(--marker-ink), -0.12em 0 0 var(--marker-ink)",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone"
  } : null;
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      lineHeight: "var(--lh-snug)",
      letterSpacing: "var(--ls-tight)",
      fontSize: fs,
      color,
      margin: 0,
      textWrap: "balance",
      ...style
    }
  }, rest), marker ? /*#__PURE__*/React.createElement("span", {
    style: markerStyle
  }, children) : children);
}
Object.assign(__ds_scope, { EditorialHeadline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/typography/EditorialHeadline.jsx", error: String((e && e.message) || e) }); }

// components/typography/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Eyebrow / supporting line. Two modes:
 *  - default: the muted sub-headline under a headline ("Tell the government to
 *    stop the AI madness."), Roman weight, sentence case.
 *  - kicker: an uppercase tracked label sitting ABOVE a headline.
 */
function Eyebrow({
  children,
  variant = "sub",
  tone = "muted",
  as = "p",
  style,
  ...rest
}) {
  const color = tone === "white" ? "var(--white)" : tone === "mint" ? "var(--mint)" : tone === "danger" ? "var(--red)" : "var(--n-200)";
  const kicker = variant === "kicker";
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      fontFamily: "var(--font-body)",
      fontWeight: kicker ? 700 : 400,
      textTransform: kicker ? "uppercase" : "none",
      letterSpacing: kicker ? "var(--ls-eyebrow)" : "var(--ls-normal)",
      fontSize: kicker ? "var(--fs-label)" : "var(--fs-lead)",
      lineHeight: kicker ? 1.2 : "var(--lh-normal)",
      color,
      margin: 0,
      textWrap: "pretty",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/typography/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/typography/PosterHeadline.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Poster headline — the ControlAI "shout".
 * Neue Haas Black, all-caps, tight tracking, optional hard offset shadow.
 * Use `tone="danger"` for the red alarm word, `italic` for extra punch.
 */
function PosterHeadline({
  children,
  size = "hero",
  tone = "white",
  shadow = "black",
  italic = false,
  as = "h2",
  style,
  ...rest
}) {
  const fs = {
    mega: "var(--fs-mega)",
    hero: "var(--fs-hero)",
    h1: "var(--fs-h1)",
    h2: "var(--fs-h2)",
    h3: "var(--fs-h3)"
  }[size] || size;
  const color = tone === "danger" ? "var(--red-pure)" : tone === "mint" ? "var(--mint)" : tone === "ink" ? "var(--black)" : "var(--white)";
  const textShadow = shadow === "red" ? "var(--shadow-danger)" : shadow === "none" ? "none" : "var(--shadow-poster)";
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 900,
      textTransform: "uppercase",
      fontStyle: italic ? "italic" : "normal",
      lineHeight: "var(--lh-tight)",
      letterSpacing: "var(--ls-tight)",
      fontSize: fs,
      color,
      textShadow,
      margin: 0,
      textWrap: "balance",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { PosterHeadline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/typography/PosterHeadline.jsx", error: String((e && e.message) || e) }); }

// ui_kits/ad-creatives/AdPresets.jsx
try { (() => {
/* ControlAI ad presets — faithful, type-driven recreations of real campaigns,
   composed entirely from design-system components. Each preset is a function
   that renders the *content* inside an <AdCanvas>; the composer supplies the
   canvas + scale. Exported to window.CAIAds for the inline composer script. */

(function () {
  const {
    AdCanvas,
    PosterHeadline,
    EditorialHeadline,
    Eyebrow,
    CtaButton,
    LogoMark
  } = window.ControlAIAdsDesignSystem_ca8c6d;
  const colStack = gap => ({
    display: "flex",
    flexDirection: "column",
    gap
  });
  const cornerBL = {
    position: "absolute",
    left: "var(--ad-margin)",
    bottom: "var(--ad-margin)"
  };

  // 1 — VINTAGE POSTER (terracotta), Billionaires
  function Billionaires({
    format,
    scale
  }) {
    return /*#__PURE__*/React.createElement(AdCanvas, {
      format: format,
      ground: "terracotta",
      scale: scale
    }, /*#__PURE__*/React.createElement("div", {
      style: colStack("28px")
    }, /*#__PURE__*/React.createElement(PosterHeadline, {
      size: format === "vertical" ? "hero" : "h1",
      tone: "ink",
      shadow: "none"
    }, "Billionaires are programming AI to maintain their power"), /*#__PURE__*/React.createElement(Eyebrow, {
      variant: "kicker",
      tone: "muted",
      style: {
        color: "var(--ink)",
        fontSize: "28px"
      }
    }, "Tell the government to stop the AI madness"), /*#__PURE__*/React.createElement(CtaButton, {
      variant: "parallelogram",
      size: "lg",
      style: {
        alignSelf: "flex-start"
      }
    }, "Take Action")), /*#__PURE__*/React.createElement("div", {
      style: cornerBL
    }, /*#__PURE__*/React.createElement(LogoMark, {
      tone: "dark",
      size: 26
    })));
  }

  // 2 — POSTER (halftone), Elevator
  function Elevator({
    format,
    scale
  }) {
    return /*#__PURE__*/React.createElement(AdCanvas, {
      format: format,
      ground: "halftone",
      scale: scale
    }, /*#__PURE__*/React.createElement("div", {
      style: colStack("10px")
    }, /*#__PURE__*/React.createElement(PosterHeadline, {
      size: "h1"
    }, "Even elevators need permits"), /*#__PURE__*/React.createElement(PosterHeadline, {
      size: format === "vertical" ? "mega" : "hero",
      italic: true,
      shadow: "black"
    }, "Why not ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--mint)"
      }
    }, "AI?"))), /*#__PURE__*/React.createElement("div", {
      style: {
        ...cornerBL,
        ...colStack("16px")
      }
    }, /*#__PURE__*/React.createElement(CtaButton, {
      variant: "parallelogram",
      size: "lg"
    }, "Take Action"), /*#__PURE__*/React.createElement(LogoMark, {
      tone: "mint",
      size: 26
    })));
  }

  // 3 — POSTER (halftone), Toaster (mixed-case / red accent)
  function Toaster({
    format,
    scale
  }) {
    return /*#__PURE__*/React.createElement(AdCanvas, {
      format: format,
      ground: "halftone",
      scale: scale
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: 0,
        fontFamily: "var(--font-display)",
        lineHeight: 1.0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontWeight: 700,
        fontStyle: "italic",
        fontSize: "62px",
        color: "#fff",
        textShadow: "var(--shadow-poster)"
      }
    }, "Your TOASTER"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontWeight: 400,
        fontSize: "46px",
        color: "#fff"
      }
    }, "has more"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontWeight: 900,
        fontSize: "70px",
        color: "#fff",
        textTransform: "uppercase",
        letterSpacing: "-.02em"
      }
    }, "Safety Regulations"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontWeight: 400,
        fontSize: "46px",
        color: "#fff",
        marginTop: "8px"
      }
    }, "than"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontWeight: 900,
        fontStyle: "italic",
        fontSize: "96px",
        color: "#fff",
        textShadow: "var(--shadow-danger)"
      }
    }, "AI")), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        right: "var(--ad-margin)",
        bottom: "var(--ad-margin)",
        ...colStack("14px"),
        alignItems: "flex-end"
      }
    }, /*#__PURE__*/React.createElement(CtaButton, {
      variant: "parallelogram",
      size: "lg"
    }, "Take Action"), /*#__PURE__*/React.createElement(LogoMark, {
      tone: "mint",
      size: 24
    })));
  }

  // 4 — EDITORIAL (black), Do you feel in control?
  function FeelControl({
    format,
    scale
  }) {
    return /*#__PURE__*/React.createElement(AdCanvas, {
      format: format,
      ground: "black",
      scale: scale
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        ...colStack("26px"),
        justifyContent: "flex-end"
      }
    }, /*#__PURE__*/React.createElement(EditorialHeadline, {
      size: format === "vertical" ? "hero" : "h1",
      marker: true
    }, "Do you feel in control?"), /*#__PURE__*/React.createElement(Eyebrow, null, "Tell the government to stop the AI madness."), /*#__PURE__*/React.createElement(CtaButton, {
      variant: "pill",
      size: "lg",
      style: {
        alignSelf: "flex-start"
      }
    }, "Sign for Control"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: "10px"
      }
    }, /*#__PURE__*/React.createElement(LogoMark, {
      tone: "mint",
      size: 22
    }))));
  }

  // 5 — EDITORIAL (ink), Don't let AI decide your fate
  function Fate({
    format,
    scale
  }) {
    return /*#__PURE__*/React.createElement(AdCanvas, {
      format: format,
      ground: "ink",
      scale: scale
    }, /*#__PURE__*/React.createElement("div", {
      style: colStack("22px")
    }, /*#__PURE__*/React.createElement(EditorialHeadline, {
      size: format === "vertical" ? "hero" : "h1",
      style: {
        textAlign: "center"
      }
    }, "Don't let AI decide your fate"), /*#__PURE__*/React.createElement(Eyebrow, {
      style: {
        textAlign: "center"
      }
    }, "Uncontrolled AI may end all life on earth."), /*#__PURE__*/React.createElement(CtaButton, {
      variant: "pill",
      size: "lg",
      style: {
        alignSelf: "center"
      }
    }, "Sign for Control")), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: "var(--ad-margin)",
        display: "flex",
        justifyContent: "center"
      }
    }, /*#__PURE__*/React.createElement(LogoMark, {
      tone: "mint",
      size: 22
    })));
  }
  window.CAIAds = {
    presets: [{
      id: "billionaires",
      label: "Billionaires",
      style: "Vintage",
      render: Billionaires
    }, {
      id: "elevator",
      label: "Elevator",
      style: "Poster",
      render: Elevator
    }, {
      id: "toaster",
      label: "Toaster",
      style: "Poster",
      render: Toaster
    }, {
      id: "feelcontrol",
      label: "Feel in control?",
      style: "Editorial",
      render: FeelControl
    }, {
      id: "fate",
      label: "Decide your fate",
      style: "Editorial",
      render: Fate
    }]
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/ad-creatives/AdPresets.jsx", error: String((e && e.message) || e) }); }

__ds_ns.CtaButton = __ds_scope.CtaButton;

__ds_ns.LogoMark = __ds_scope.LogoMark;

__ds_ns.AdCanvas = __ds_scope.AdCanvas;

__ds_ns.EditorialHeadline = __ds_scope.EditorialHeadline;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.PosterHeadline = __ds_scope.PosterHeadline;

})();
