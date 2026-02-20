# Icon Visibility Bug - Root Cause Analysis & Fix

## Investigation Summary

### Root Cause Identified: ✅ **HYPOTHESIS #12 - CSS uses currentColor but wrapper color is set incorrectly**

**File:** `client/src/styles/theme.css` lines 85-93
**Issue:** Global CSS rule sets all `<a>` tags to `var(--color-primary)` (navy blue)
```css
a {
  color: var(--color-primary);
  ...
}
```

**Why this breaks active icons:**
- React Router's `<Link>` component renders as an `<a>` tag
- Global rule applies navy color to the Link element
- SVG icons use `stroke="currentColor"` which inherits from parent
- When active icon should be white, the global rule forces navy color
- Even with inline styles on wrapper div, the Link's color cascades down

---

## Hypotheses Checked (Top 20)

### CSS / VISIBILITY / COLOR ✅ VERIFIED

1. ✅ **icon svg has opacity: 0** - NOT FOUND: No opacity rules affecting icons
2. ✅ **icon svg has visibility: hidden** - NOT FOUND: No visibility rules
3. ✅ **icon svg has color: transparent** - NOT FOUND: No transparent colors
4. ✅ **icon stroke/fill is white on white background** - NOT FOUND: Background is navy when active
5. ✅ **active state sets color to background color** - NOT FOUND: Active state correctly sets white
6. ✅ **CSS specificity issue** - **FOUND**: Global `a { color }` rule has higher specificity than expected
7. ✅ **CSS :not(:hover) rule** - NOT FOUND: No such rules
8. ✅ **Global CSS rule affects all svgs** - NOT FOUND: No global SVG rules
9. ✅ **CSS filter/brightness** - NOT FOUND: No filters applied
10. ✅ **mix-blend-mode** - NOT FOUND: No blend modes
11. ✅ **CSS transition sets opacity to 0** - NOT FOUND: No opacity transitions
12. ✅ **CSS uses currentColor but wrapper color wrong** - **ROOT CAUSE FOUND**
    - Global `a { color: var(--color-primary) }` in theme.css line 85
    - Link component inherits this, overriding our intended white color

### STACKING / OVERLAYS / Z-INDEX ✅ VERIFIED

13. ✅ **Overlay pseudo-element covers icon** - NOT FOUND: No :before/:after overlays
14. ✅ **overflow hidden clips icon** - NOT FOUND: No overflow issues
15. ✅ **border-radius clips icon** - NOT FOUND: Icons render correctly
16. ✅ **Background image/gradient masks icon** - NOT FOUND: Solid backgrounds only

### JS / ROUTING / ACTIVE DETECTION ✅ VERIFIED

17. ✅ **Active-route logic wrong** - VERIFIED CORRECT:
    - TopNav.js lines 13-16 correctly detect active routes
    - Pathname matching works: `/store`, `/profile/messages`, `/profile/favourites`, `/profile`
18. ✅ **Two different nav components** - NOT FOUND: Single TopNav component used everywhere
19. ✅ **Conditional icon variant missing props** - NOT FOUND: Same icon components used

### BUILD / CACHING / DEPLOYMENT ✅ VERIFIED

20. ✅ **Stale bundle/caching** - VERIFIED: Latest commits deployed, but issue persists
    - This indicates a code issue, not caching
    - Code changes are in repo and deployed

---

## Fix Implemented

### Files Changed:

1. **`client/src/components/IconButton.js`**
   - **Line 43**: Set `stroke={iconColor}` directly on SVG element (bypasses currentColor)
   - **Line 48**: Add `nav-icon-hover` class for hover enhancement
   - **Line 87-92**: Set `color: 'inherit'` on Link to prevent global rule from cascading
   - **Line 72**: Keep inline `color` style on wrapper div

2. **`client/src/styles/index.css`**
   - **Lines 8-12**: Add `.nav-icon-hover:hover svg` rule for hover enhancement

### Key Changes:

```javascript
// 1. Set stroke directly on SVG (bypasses currentColor inheritance)
const iconWithColor = icon ? cloneElement(icon, {
    stroke: iconColor, // Direct stroke override
    style: { color: iconColor },
    className: `${icon.props?.className || 'w-5 h-5'} ${!isActive ? 'nav-icon-hover' : ''}`
}) : null;

// 2. Prevent Link from inheriting global link color
<Link
    style={{
        color: 'inherit', // Don't apply global a { color } rule
        textDecoration: 'none'
    }}
>
```

```css
/* 3. Hover enhancement CSS */
.nav-icon-hover:hover svg {
    stroke: var(--color-primary) !important;
}
```

---

## How to Verify in Production

### 1. Clear Browser Cache
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Or open DevTools → Application → Clear Storage → Clear site data
- Or test in incognito/private window

### 2. Check Bundle Hash (Verify Latest Code)
- Open DevTools → Network tab
- Reload page
- Look for `main.<hash>.js` file
- Compare hash with latest commit hash in Netlify build logs
- If hash matches latest commit, code is deployed

### 3. Visual Verification
Navigate to each route and verify:

- **`/store`**
  - ✅ Store icon is **white** (visible) on navy background
  - ✅ Other icons are **dark gray** (visible)
  - ✅ Hover on non-active icons changes to navy (enhancement)

- **`/profile/messages`**
  - ✅ Messages icon is **white** (visible) on navy background
  - ✅ Other icons are **dark gray** (visible)

- **`/profile/favourites`**
  - ✅ Saved icon is **white** (visible) on navy background
  - ✅ Other icons are **dark gray** (visible)

- **`/profile`**
  - ✅ Profile avatar is highlighted (handled by AvatarMenu)
  - ✅ Other icons are **dark gray** (visible)

### 4. DevTools Inspection
For active icon (e.g., on `/store`):
1. Inspect the Store icon SVG element
2. Check computed styles:
   - `stroke` should be `rgb(255, 255, 255)` or `#ffffff`
   - `color` should be `rgb(255, 255, 255)` or `#ffffff`
3. Check parent Link element:
   - `color` should be `inherit` (not navy)
4. Verify no conflicting styles overriding stroke

### 5. Regression Check
- ✅ Active icon visible without hover
- ✅ Non-active icons visible without hover  
- ✅ Hover still works (enhancement)
- ✅ Navigation still works (clicking icons)
- ✅ Focus states work (keyboard navigation)

---

## Commit Details

**Commit:** `996dea9b`
**Files Changed:**
- `client/src/components/IconButton.js` (+15 lines, -6 lines)
- `client/src/styles/index.css` (+6 lines)

**Pushed to:** `main` branch

---

## If Issue Persists

If icons are still not visible after this fix:

1. **Check Netlify build logs** - Ensure build succeeded
2. **Verify CSS is loading** - Check Network tab for `main.<hash>.css`
3. **Check for CSS conflicts** - Look for Semantic UI or other CSS overriding our rules
4. **Inspect computed styles** - Use DevTools to see what styles are actually applied
5. **Check SVG rendering** - Verify SVG elements exist in DOM and have correct attributes

The fix sets stroke directly on SVG elements, which should override any CSS inheritance issues.

