(function() {
    "use strict";
    function escapeHtml(text) {
        if (typeof text !== "string") return String(text);
        return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
    }

    function wrapSpan(text, className) {
        return `<span class="${className}">${text}</span>`;
    }

    function tokenizeAndHighlight(code, languagePatterns) {
        const collectedMatches = [];
        let patternIdCounter = 0;

        for (const pattern of languagePatterns) {
            patternIdCounter++;
            const regex = new RegExp(pattern.regex.source, 'g' + (pattern.regex.flags || ''));
            let match;
            try {
                while ((match = regex.exec(code)) !== null) {
                    if (match.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                    collectedMatches.push({
                        patternId: patternIdCounter,
                        match: match,
                        start: match.index,
                        end: match.index + match[0].length,
                        value: match[0],
                        className: pattern.className,
                        isBlock: pattern.isBlock || false,
                        highlighterFn: pattern.highlighterFn
                    });
                }
            } catch (e) {
                console.error("SyntaxShine: Error in regex execution for pattern:", pattern.regex, e);
            }
        }

        collectedMatches.sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            if (a.value.length !== b.value.length) return b.value.length - a.value.length;
            if (a.isBlock !== b.isBlock) return a.isBlock ? -1 : 1;
            return a.patternId - b.patternId;
        });

        const finalHtmlParts = [];
        let lastProcessedIndex = 0;
        const processedRanges = []; // To track segments already covered

        for (const token of collectedMatches) {
            let skipToken = false;
            for (const range of processedRanges) {
                if (token.start >= range.start && token.start < range.end) {
                    skipToken = true;
                    break;
                }
            }
            if (skipToken) continue;

            if (token.start > lastProcessedIndex) {
                finalHtmlParts.push(code.substring(lastProcessedIndex, token.start));
            }

            let tokenHtml = '';
            if (token.isBlock && typeof token.highlighterFn === 'function') {
                try {
                    tokenHtml = token.highlighterFn(token.match);
                } catch (e) {
                    tokenHtml = wrapSpan(token.value, token.className + ' hljs-error');
                    console.error("SyntaxShine: Error during block highlighting:", token.value, e);
                }
            } else {
                tokenHtml = wrapSpan(token.value, token.className);
            }
            finalHtmlParts.push(tokenHtml);

            lastProcessedIndex = Math.max(lastProcessedIndex, token.end);
            processedRanges.push({ start: token.start, end: token.end });
            processedRanges.sort((a,b) => a.start - b.start);
        }

        if (lastProcessedIndex < code.length) {
            finalHtmlParts.push(code.substring(lastProcessedIndex));
        }
        return finalHtmlParts.join('');
    }

    const _languages = {
        js: function(code) {
            const patterns = [
                { regex: /(\/\*\*[\s\S]*?\*\/)/g, className: 'hljs-comment hljs-doctag', isBlock:true, highlighterFn: (match) => {
                    let docContent = match[0];
                    docContent = docContent.replace(/(@[a-zA-Z]+)/g, wrapSpan('$1', 'hljs-tag'));
                    docContent = docContent.replace(/(^|\n|\r\n)(\s*\*?\s*)(@param|@returns|@type|@throws|@typedef|@property|@see|@link|@memberof|@augments|@extends|@class|@constructor|@function|@method|@field|@var|@const|@enum|@event|@fires|@listens|@callback|@interface|@template|@override|@private|@protected|@public|@static|@abstract|@final|@override|@readonly|@deprecated|@example|@tutorial|@todo|@license|@author|@version|@since|@kind|@namespace|@summary|@description|@default|@example|@link|@module|@name|@return|@this|@instance|@yields|@argument|@arg|@param|@return|@throws|@exception|@see|@tutorial|@fires|@event|@listens|@callback|@typedef|@template|@implements|@augments|@extends|@enum|@global|@interface|@mixin|@namespace|@type|@property|@readonly|@virtual|@override|@deprecated|@example|@todo|@license|@author|@version|@since|@deprecated|@enum|@fires|@example|@todo)\b/g, wrapSpan('$2', 'hljs-tag') + wrapSpan('$3', 'hljs-keyword'));
                    docContent = docContent.replace(/\{([^{}]+)\}/g, wrapSpan('{$1}', 'hljs-type'));
                    docContent = docContent.replace(/\[([^\[\]]+)\]/g, wrapSpan('[$1]', 'hljs-variable'));
                    return wrapSpan(docContent, 'hljs-comment hljs-doctag');
                }},
                { regex: /(\/\*[\s\S]*?\*\/)/g, className: 'hljs-comment' },
                { regex: /(\/\/.*)/g, className: 'hljs-comment' },
                {
                    regex: /(`(?:[^`\\]|\\.)*`)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g,
                    isBlock: true,
                    highlighterFn: (match) => {
                        const backtickStr = match[1], doubleQuoteStr = match[2], singleQuoteStr = match[3];
                        if (backtickStr) {
                            let content = backtickStr.substring(1, backtickStr.length - 1);
                            let highlightedContent = escapeHtml(content);
                            const trimmedContent = content.trim();

                            if (trimmedContent.startsWith('&lt;') && trimmedContent.endsWith('&gt;') && trimmedContent.includes('&lt;/')) {
                                highlightedContent = _languages.html(content);
                            } else if (trimmedContent.includes(':') && trimmedContent.includes(';') && trimmedContent.includes('{') && trimmedContent.includes('}')) {
                                highlightedContent = _languages.css(content);
                            } else {
                                highlightedContent = highlightedContent.replace(/(\$\{)([^{}]+)(\})/g, (m, openBrace, expr, closeBrace) =>
                                    wrapSpan(openBrace, 'hljs-operator') + _languages.js(expr) + wrapSpan(closeBrace, 'hljs-operator'));
                                highlightedContent = _languages.freestyle(highlightedContent);
                            }
                            return wrapSpan('`' + highlightedContent + '`', 'hljs-string');
                        } else if (doubleQuoteStr || singleQuoteStr) {
                            return wrapSpan(match[0], 'hljs-string');
                        }
                        return match[0];
                    }
                },
                { regex: /\b(abstract|arguments|await|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|eval|export|extends|false|final|finally|float|for|function|goto|if|implements|import|in|instanceof|int|interface|let|long|native|new|null|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|true|try|typeof|var|void|volatile|while|with|yield|async|from|as|get|set|of|constructor|debugger|declare|module|namespace|type|keyof|infer|readonly|satisfies|is|asserts|unique|symbol|bigint|global|require|module|exports|globalThis)\b/g, className: 'hljs-keyword' },
                { regex: /\b(0x[0-9a-fA-F_]+|0o[0-7_]+|0b[01_]+|[0-9][0-9_]*(\.[0-9_]+)?([eE][+\-]?\d+)?|NaN|Infinity|null|undefined)\b/g, className: 'hljs-number' },
                { regex: /(\+\+|--|===|!==|==|!=|<=|>=|<|>|=|!|\+=|-=|\*=|%=|\/=|&&|\|\||\?\?|\?|\:|\*|\/|%|\+|\-|\{|\}|\(|\)|\[|\]|;|,|\.|\=\>|\.\.\.|\=\=\=|\!\=\=|\?\.)/g, className: 'hljs-operator' },
                { regex: /(?:^|[=(:;,\]\s])(\/(?:[^/\\]|\\.)+\/[gmiyu]*)(?=\s*[;,\)\].]|$|\n)/g, className: 'hljs-regexp', isBlock:true, highlighterFn: (match) => match[0].substring(0, match.index - match[1].index) + wrapSpan(match[1], 'hljs-regexp') },
                { regex: /\b([a-zA-Z_$][0-9a-zA-Z_$]*)(?=\s*\()/g, className: 'hljs-title hljs-function' },
                { regex: /\b([a-zA-Z_$][0-9a-zA-Z_$]*)(?=\s*:|\s*\.)/g, className: 'hljs-attr' },
                { regex: /\b([A-Z][a-zA-Z0-9_$]*)\b/g, className: 'hljs-title hljs-class' },
                { regex: /\b(console|document|window|Math|Array|Object|String|Number|Boolean|Date|RegExp|Error|Promise|Set|Map|WeakSet|WeakMap|JSON|Proxy|Reflect|Symbol|BigInt|Intl|WebAssembly|setTimeout|setInterval|clearTimeout|clearInterval|localStorage|sessionStorage|indexedDB|history|navigator|location|performance|requestAnimationFrame|cancelAnimationFrame|URLSearchParams|FormData|Worker|XMLHttpRequest|fetch|NodeList|Element|HTMLElement|Event|CustomEvent|Promise|Function|Symbol|BigInt|JSON|globalThis|queueMicrotask|structuredClone|atob|btoa|URL|Blob|File|FileReader|Image|Audio|Video|CanvasRenderingContext2D|WebGLRenderingContext|WebSocket|EventSource|ServiceWorker|BroadcastChannel|Crypto|TextEncoder|TextDecoder|Blob|File|FileReader|Image|Audio|Video|CanvasRenderingContext2D|WebGLRenderingContext|WebSocket|EventSource|ServiceWorker|BroadcastChannel|Crypto|TextEncoder|TextDecoder)\b/g, className: 'hljs-built_in' },
                { regex: /\b([a-zA-Z_$][0-9a-zA-Z_$]*)\b/g, className: 'hljs-variable' },
                { regex: /(@[a-zA-Z_$][0-9a-zA-Z_$]*)/g, className: 'hljs-meta' },
                { regex: /(#!)(\/[^\n]+)/g, className: 'hljs-meta' }
            ];
            return tokenizeAndHighlight(code, patterns);
        },
        html: function(code) {
            const patterns = [
                { regex: /(&lt;!--[\s\S]*?--&gt;)/g, className: 'hljs-comment' },
                { regex: /(&lt;!DOCTYPE\s+[^&gt;]*&gt;)/g, className: 'hljs-meta hljs-doctag' },
                { regex: /(&amp;(?:[a-zA-Z0-9#]+|#x[0-9a-fA-F]+);)/g, className: 'hljs-symbol' },
                { regex: /(&lt;script((?:\s+[^&gt;]*)*?)&gt;)([\s\S]*?)(&lt;\/script&gt;)/g, isBlock: true, highlighterFn: (match) => {
                    const startTag = match[1], content = match[3], endTag = match[4];
                    let highlightedContent = content;
                    try { highlightedContent = _languages.js(content); } catch (e) { highlightedContent = escapeHtml(content); }
                    return `${_languages.html.internalHighlightTag(startTag)}${highlightedContent}${_languages.html.internalHighlightTag(endTag)}`;
                }},
                { regex: /(&lt;style((?:\s+[^&gt;]*)*?)&gt;)([\s\S]*?)(&lt;\/style&gt;)/g, isBlock: true, highlighterFn: (match) => {
                    const startTag = match[1], content = match[3], endTag = match[4];
                    let highlightedContent = content;
                    try { highlightedContent = _languages.css(content); } catch (e) { highlightedContent = escapeHtml(content); }
                    return `${_languages.html.internalHighlightTag(startTag)}${highlightedContent}${_languages.html.internalHighlightTag(endTag)}`;
                }},
                {
                    regex: /(&lt;(\/?)([a-zA-Z0-9:-]+)((?:\s+[a-zA-Z0-9-]+(?:=(?:&quot;[^&quot;]*&quot;|&#039;[^&#039;]*&#039;|[^\s&gt;]+))?)*?)(\s*\/?)&gt;)/g,
                    isBlock: true,
                    highlighterFn: (match) => {
                        const fullTag = match[1], slash = match[2], tagName = match[3], attributesString = match[4], closingBracket = match[5];
                        if (fullTag.includes('<span class="hljs-')) return fullTag;
                        const parts = ['&lt;'];
                        if (slash) parts.push(wrapSpan(slash, 'hljs-operator'));
                        parts.push(wrapSpan(tagName, 'hljs-name'));

                        const attrRegex = /([a-zA-Z0-9-]+)(?:(=)(?:(&quot;[^&quot;]*&quot;)|(&#039;[^&#039;]*&#039;)|([^\s&gt;]+)))?/g;
                        let attrMatch;
                        let lastAttrIndex = 0;
                        while ((attrMatch = attrRegex.exec(attributesString)) !== null) {
                            if (attrMatch.index > lastAttrIndex) parts.push(attributesString.substring(lastAttrIndex, attrMatch.index));
                            const attrName = attrMatch[1], eq = attrMatch[2], attrValue = attrMatch[3] || attrMatch[4] || attrMatch[5];
                            parts.push(wrapSpan(attrName, 'hljs-attr'));
                            if (eq) { parts.push(wrapSpan(eq, 'hljs-operator')); if (attrValue) parts.push(wrapSpan(attrValue, 'hljs-string')); }
                            lastAttrIndex = attrMatch.index + attrMatch[0].length;
                        }
                        if (lastAttrIndex < attributesString.length) parts.push(attributesString.substring(lastAttrIndex));
                        parts.push(wrapSpan(closingBracket, 'hljs-operator'));
                        return parts.join('');
                    }
                },
                { regex: /(&lt;!--\[if[\s\S]*?&gt;[\s\S]*?&lt;!\[endif\]--&gt;)/g, className: 'hljs-meta' },
                { regex: /(&lt;(\w+)\s+[^&gt;]*?(?:onload|onerror|onclick|onmouseover|onmouseout|onfocus|onblur|onsubmit|onchange|oninput|onkeydown|onkeyup|onkeypress|onselect|onresize|onscroll|ondrag|ondrop|oncut|oncopy|onpaste)="[^"]*"[^&gt;]*?&gt;)/g, className: 'hljs-attr hljs-built_in' },
                { regex: /(&lt;!--.*?--&gt;)/g, className: 'hljs-comment' },
                { regex: /(&lt;!\[CDATA\[[\s\S]*?\]\]&gt;)/g, className: 'hljs-comment' },
                { regex: /(&lt;!--\[if[^\]]+\]&gt;)/g, className: 'hljs-comment' },
                { regex: /(&lt;!\[endif\]--&gt;)/g, className: 'hljs-comment' },
                { regex: /(&lt;\?xml[\s\S]*?\?&gt;)/g, className: 'hljs-meta' },
                { regex: /(&lt;!ENTITY[\s\S]*?&gt;)/g, className: 'hljs-meta' },
                { regex: /(&lt;!NOTATION[\s\S]*?&gt;)/g, className: 'hljs-meta' },
                { regex: /(&lt;!ATTLIST[\s\S]*?&gt;)/g, className: 'hljs-meta' },
                { regex: /(&lt;!--#include[\s\S]*?--&gt;)/g, className: 'hljs-meta' }
            ];
            return tokenizeAndHighlight(code, patterns);
        },
        internalHighlightTag: function(e){return e.replace(/(&lt;)(\/?)([a-zA-Z0-9:]+)([^&gt;]*?)(\/?&gt;)/g,(e,t,n,i,r,c)=>{let o=r.replace(/([a-zA-Z0-9-]+)(=)("(?:[^"\\]|\\.)*?"|'(?:[^'\\]|\\.)*?')/g,(e,t,n,i)=>a(t,"hljs-attr")+a(n,"hljs-operator")+a(i,"hljs-string"));o=o.replace(/(\s)([a-zA-Z0-9-]+)(?=\s*(&gt;|\/?&gt;|\s*[a-zA-Z0-9-]+="))/g,(e,t,n)=>`${t}${a(n,"hljs-attr")}`);o=o.replace(/(\s\/)/g,a("$1","hljs-operator"));return`${t}${a(n,"hljs-operator")}${a(i,"hljs-name")}${o}${c}`})},
        css: function(code) {
            const patterns = [
                { regex: /(\/\*[\s\S]*?\*\/)/g, className: 'hljs-comment' },
                { regex: /(\@(charset|import|namespace|media|supports|document|page|font-face|keyframes|viewport|custom-media|counter-style|font-feature-values|top-left-corner|top-left|top-center|top-right|top-right-corner|bottom-left-corner|bottom-left|bottom-center|bottom-right|bottom-right-corner|container|layer|scope|property|plugin|font-feature-values|swash|ornaments|stylistic|styleset|character-variant|font-variant|font-stretch|font-feature-settings|font-language-override|font-variation-settings|size|width|height|line-height|letter-spacing|word-spacing|text-indent|text-align|vertical-align|white-space|word-wrap|text-overflow|overflow|visibility|opacity|z-index|box-shadow|text-shadow|border-radius|background-image|background-position|background-size|background-repeat|background-attachment|background-origin|background-clip|background|border|outline|margin|padding|left|right|top|bottom|position|display|float|clear|flex|grid|columns|transform|transition|animation|filter|backdrop-filter|clip-path|offset-path|offset-distance|offset-rotate|offset-anchor|mask|mask-image|mask-mode|mask-origin|mask-position|mask-repeat|mask-size|mask-composite|mask-type|pointer-events|cursor|resize|user-select|touch-action|will-change|contain|tab-size|columns|column-count|column-width|column-gap|column-rule|column-span|box-decoration-break|shape-outside|shape-image-threshold|shape-margin|offset|offset-path|offset-distance|offset-rotate|offset-anchor))\b/g, className: 'hljs-meta' },
                { regex: /("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g, className: 'hljs-string' },
                { regex: /\b(\d+(\.\d+)?(px|em|%|rem|vh|vw|ch|ex|pt|pc|in|cm|mm|deg|grad|rad|turn|ms|s|Hz|kHz|s|ms|fr|rem|em|vw|vh|vmin|vmax|ch|ex)?)\b/g, className: 'hljs-number' },
                { regex: /\b(!important)\b/g, className: 'hljs-keyword' },
                { regex: /(\-\-[a-zA-Z0-9_-]+)/g, className: 'hljs-variable' },
                {
                    regex: /\b([a-zA-Z-]+)\s*(\()([^)]*)(\))/g,
                    isBlock: true,
                    highlighterFn: (match) => {
                        const funcName = match[1], openParen = match[2], args = match[3], closeParen = match[4];
                        let highlightedArgs = args.replace(/("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g, wrapSpan('$1', 'hljs-string'))
                                                  .replace(/\b(\d+(\.\d+)?(px|em|%)?)\b/g, wrapSpan('$1', 'hljs-number'))
                                                  .replace(/(:|,)/g, wrapSpan('$1', 'hljs-operator'));
                        return wrapSpan(funcName, 'hljs-function') + wrapSpan(openParen, 'hljs-operator') + highlightedArgs + wrapSpan(closeParen, 'hljs-operator');
                    }
                },
                {
                    regex: /(\#[a-zA-Z0-9_-]+)|(\.[a-zA-Z0-9_-]+)|([a-zA-Z-]+)|(:\w+)|(::\w+)|(\s*(?:[>+~]|\*)\s*)|(\[.*?\])/g,
                    isBlock: true,
                    highlighterFn: (match) => {
                        const fullMatch = match[0], id = match[1], cls = match[2], tag = match[3], pseudoClass = match[4], pseudoElem = match[5], combinator = match[6], attributeSelector = match[7];
                        if (id) return wrapSpan(fullMatch, 'hljs-selector-id');
                        if (cls) return wrapSpan(fullMatch, 'hljs-selector-class');
                        if (tag) return wrapSpan(fullMatch, 'hljs-selector-tag');
                        if (pseudoClass || pseudoElem) return wrapSpan(fullMatch, 'hljs-selector-pseudo');
                        if (combinator) return wrapSpan(fullMatch, 'hljs-operator');
                        if (attributeSelector) {
                            return attributeSelector.replace(/([a-zA-Z0-9-]+)(=)("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g,
                                (m, name, eq, dblVal, sglVal) => wrapSpan(name, 'hljs-attr') + wrapSpan(eq, 'hljs-operator') + wrapSpan(dblVal || sglVal, 'hljs-string')
                            );
                        }
                        return fullMatch;
                    }
                },
                { regex: /\b([a-zA-Z-]+)(?=\s*:(?![=]))/g, className: 'hljs-property' },
                { regex: /(:|;|\{|\}|,)/g, className: 'hljs-operator' },
                { regex: /\b(var|calc|min|max|clamp|rgb|rgba|hsl|hsla|url|linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient|repeating-conic-gradient|attr|env|constant|string|image|element|selector|url|env|fit-content|min-content|max-content|auto|initial|inherit|unset|revert|none|currentColor|transparent|invert|sepia|grayscale|brightness|contrast|saturate|drop-shadow|blur|url|matrix|matrix3d|translate|translate3d|translateX|translateY|translateZ|scale|scale3d|scaleX|scaleY|scaleZ|rotate|rotate3d|rotateX|rotateY|rotateZ|skew|skewX|skewY|perspective|transform|font|text-shadow|box-shadow|text-decoration|background|border|outline|margin|padding|width|height|min-width|max-width|min-height|max-height|left|right|top|bottom|display|position|float|clear|z-index|list-style|vertical-align|text-align|line-height|letter-spacing|word-spacing|white-space|text-transform|text-indent|direction|unicode-bidi|word-break|line-break|hyphens|tab-size|columns|column-count|column-width|column-gap|column-rule|column-span|box-decoration-break|shape-outside|shape-image-threshold|shape-margin|mask|mask-image|mask-mode|mask-origin|mask-position|mask-repeat|mask-size|mask-composite|mask-type|filter|backdrop-filter|clip-path|offset-path|offset-distance|offset-rotate|offset-anchor|grid|grid-template-rows|grid-template-columns|grid-template-areas|grid-auto-rows|grid-auto-columns|grid-auto-flow|grid-column-start|grid-column-end|grid-row-start|grid-row-end|grid-area|grid-column|grid-row|grid-gap|gap|row-gap|column-gap|flex|flex-direction|flex-wrap|flex-flow|justify-content|align-items|align-content|align-self|order|flex-grow|flex-shrink|flex-basis|place-content|place-items|place-self|appearance|backface-visibility|clip|counter-increment|counter-reset|cursor|empty-cells|font-feature-settings|font-language-override|font-variant|font-variant-alternates|font-variant-caps|font-variant-east-asian|font-variant-ligatures|font-variant-numeric|font-variant-position|hanging-punctuation|image-orientation|image-rendering|isolation|line-break|object-fit|object-position|orphans|perspective-origin|pointer-events|quotes|ruby-align|ruby-overhang|ruby-position|speak-as|table-layout|text-combine-upright|text-decoration-color|text-decoration-line|text-decoration-style|text-emphasis|text-emphasis-color|text-emphasis-position|text-emphasis-style|text-justify|text-orientation|text-rendering|text-size-adjust|text-underline-position|touch-action|transform-box|transform-origin|transform-style|transition-delay|transition-duration|transition-property|transition-timing-function|unicode-bidi|word-break|word-wrap|writing-mode|align-self|animation|animation-delay|animation-direction|animation-duration|animation-fill-mode|animation-iteration-count|animation-name|animation-play-state|animation-timing-function|background-blend-mode|background-origin|background-repeat|background-size|border-collapse|border-image|border-image-outset|border-image-repeat|border-image-slice|border-image-source|border-image-width|box-decoration-break|caption-side|clear|clip|color|column-fill|column-rule|column-rule-color|column-rule-style|column-rule-width|column-span|direction|empty-cells|flex-basis|flex-direction|flex-flow|flex-grow|flex-shrink|flex-wrap|float|font-kerning|font-language-override|font-synthesis|font-variant-alternates|font-variant-caps|font-variant-east-asian|font-variant-ligatures|font-variant-numeric|font-variant-position|hyphens|image-orientation|image-rendering|isolation|justify-content|list-style|list-style-image|list-style-position|list-style-type|mask|mask-clip|mask-composite|mask-image|mask-mode|mask-origin|mask-position|mask-repeat|mask-size|mix-blend-mode|object-fit|object-position|offset|offset-anchor|offset-distance|offset-path|offset-rotate|opacity|order|orphans|perspective|perspective-origin|place-content|place-items|place-self|pointer-events|position|resize|scroll-behavior|scroll-snap-align|scroll-snap-stop|scroll-snap-type|shape-image-threshold|shape-margin|shape-outside|tab-size|table-layout|text-align-last|text-combine-upright|text-decoration-line|text-decoration-style|text-emphasis|text-emphasis-color|text-emphasis-position|text-emphasis-style|text-justify|text-orientation|text-rendering|text-size-adjust|text-underline-offset|text-underline-position|top|left|bottom|right|transform|transform-box|transform-origin|transform-style|transition|transition-delay|transition-duration|transition-property|transition-timing-function|unicode-bidi|user-select|vertical-align|white-space|widows|will-change|word-break|word-spacing|writing-mode|z-index)\b/g, className: 'hljs-built_in' },
                { regex: /\b(absolute|relative|fixed|sticky|static|flex|grid|block|inline|inline-block|none|hidden|visible|auto|scroll|overflow|contain|clip|border-box|content-box|padding-box|margin-box|fill-box|stroke-box|view-box|user-space-on-use|object-bounding-box|center|left|right|top|bottom|stretch|start|end|baseline|first-baseline|last-baseline|safe|unsafe|space-between|space-around|space-evenly|thin|medium|thick|none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset|light|normal|bold|bolder|lighter|italic|oblique|small-caps|uppercase|lowercase|capitalize|full-width|full-size-kana|inline-flex|inline-grid|table|table-row|table-cell|list-item|run-in|compact|marker|box|fit-content|min-content|max-content|auto|inherit|initial|unset|revert|revert-layer|ease|linear|ease-in|ease-out|ease-in-out|step-start|step-end|steps|cubic-bezier)\b/g, className: 'hljs-keyword' }
            ];
            return tokenizeAndHighlight(code, patterns);
        },
        freestyle: function(code) {
            const patterns = [
                { regex: /(\/\*[\s\S]*?\*\/)|(\/\/.*)|(&lt;!--[\s\S]*?--&gt;)/g, className: 'hljs-comment' },
                { regex: /(`(?:[^`\\]|\\.)*`)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g, className: 'hljs-string' },
                { regex: /\b(\d+(\.\d+)?)\b/g, className: 'hljs-number' },
                { regex: /\b(true|false|null|undefined)\b/g, className: 'hljs-literal' },
                { regex: /(\+\+|--|===|!==|==|!=|<=|>=|<|>|=|!|\+=|-=|\*=|%=|\/=|&&|\|\||\?\?|\?|\:|\*|\/|%|\+|\-|\{|\}|\(|\)|\[|\]|;|,|\.)/g, className: 'hljs-operator' },
                { regex: /\b([a-zA-Z_$][0-9a-zA-Z_$]*)(?=\s*[:=])/g, className: 'hljs-attr' },
                { regex: /\b([a-zA-Z_$][0-9a-zA-Z_$]*)\b/g, className: 'hljs-variable'},
                { regex: /(https?:\/\/[^\s$.?#].[^\s]*)/g, className: 'hljs-link' },
                { regex: /(mailto:[^\s$]+)/g, className: 'hljs-link' },
                { regex: /(data:[^;,\s]+;base64,[^\s]*)/g, className: 'hljs-string' },
                { regex: /([A-Z_][A-Z0-9_]*)/g, className: 'hljs-constant' },
                { regex: /([A-Z][a-zA-Z0-9_]*)(?=\.)/g, className: 'hljs-title hljs-class' },
                { regex: /\b(error|warn|info|log|debug)\b/g, className: 'hljs-built_in' },
                { regex: /\b(const|let|var|function|class|if|else|for|while|return)\b/g, className: 'hljs-keyword' },
                { regex: /(\s?=&gt;\s?)/g, className: 'hljs-operator' },
                { regex: /(#[\da-fA-F]{3,6})\b/g, className: 'hljs-number' },
                { regex: /(rgb|rgba|hsl|hsla)\(\s*\d{1,3}%?(?:,\s*\d{1,3}%?){2,3}\s*\)/g, className: 'hljs-built_in' }
            ];
            return tokenizeAndHighlight(code, patterns);
        }
    };

    _languages.js.keywordsRegex = /\b(abstract|arguments|await|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|eval|export|extends|false|final|finally|float|for|function|goto|if|implements|import|in|instanceof|int|interface|let|long|native|new|null|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|true|try|typeof|var|void|volatile|while|with|yield|async|from|as|get|set|of|constructor|debugger|declare|module|namespace|type|keyof|infer|readonly|satisfies|is|asserts|unique|symbol|bigint|global|require|module|exports|globalThis)\b/g;

    const hljs = {
        highlightAll: function() {
            const codeBlocks = Array.from(document.querySelectorAll('pre code'));
            let index = 0;
            const processNextBlock = () => {
                if (index < codeBlocks.length) {
                    const block = codeBlocks[index];
                    try {
                        this.highlightElement(block);
                    } catch (error) {
                        block.innerHTML = escapeHtml(block.textContent);
                        block.classList.add('hljs', 'hljs-error');
                    } finally {
                        index++;
                        setTimeout(processNextBlock, 0);
                    }
                }
            };
            processNextBlock();
        },
        highlightElement: function(element) {
            const rawCode = element.textContent;
            const classList = Array.from(element.classList);
            let languageId = 'freestyle';
            if (classList.includes('language-js') || classList.includes('lang-js') || classList.includes('javascript')) languageId = 'js';
            else if (classList.includes('language-html') || classList.includes('lang-html') || classList.includes('xml') || classList.includes('markup')) languageId = 'html';
            else if (classList.includes('language-css') || classList.includes('lang-css')) languageId = 'css';

            try {
                const result = this.highlight(rawCode, { language: languageId });
                element.innerHTML = result.value;
                element.classList.add('hljs');
                element.setAttribute('data-highlighted-language', result.language);
                element.classList.remove('hljs-error');
            } catch (error) {
                element.innerHTML = escapeHtml(rawCode);
                element.classList.add('hljs', 'hljs-error');
            }
        },
        highlight: function(codeString, options) {
            const requestedLangId = options && options.language ? options.language.toLowerCase() : 'freestyle';
            let highlightedValue = '';
            let finalLanguageId = requestedLangId;
            const safeCodeString = typeof codeString === 'string' ? codeString : String(codeString);
            const escapedInput = escapeHtml(safeCodeString);

            try {
                if (_languages[requestedLangId]) {
                    highlightedValue = _languages[requestedLangId](escapedInput);
                } else {
                    highlightedValue = _languages.freestyle(escapedInput);
                    finalLanguageId = 'freestyle';
                }
            } catch (error) {
                highlightedValue = escapedInput;
                finalLanguageId = 'error-fallback';
            }
            return { value: highlightedValue, language: finalLanguageId, relevance: 0, top: null, illegal: false };
        },
        configure: function(options) {
            // This method can be extended to handle various global configurations.
            // For instance, you could configure custom CSS selectors, default languages,
            // or logging levels.
            // Example: hljs.configure({ selector: '.my-code-block', defaultLang: 'html' });
            // For now, it's a placeholder but ensures API compatibility.
            if (options) {
                if (options.selector) hljs._private.config.selector = options.selector;
                if (options.defaultLanguage) hljs._private.config.defaultLanguage = options.defaultLanguage;
            }
        },
        _private: {
            languages: _languages,
            escapeHtml: escapeHtml,
            tokenizeAndHighlight: tokenizeAndHighlight,
            config: {
                selector: 'pre code', // Default selector for highlightAll
                defaultLanguage: 'freestyle' // Default language if none detected
            },
            // Utility for detailed debugging, not for production
            logDebug: function(message, data) {
                if (hljs._private.config.debugMode) {
                    console.log("SyntaxShine Debug: " + message, data);
                }
            },
            logError: function(message, error) {
                console.error("SyntaxShine Error: " + message, error);
            }
        }
    };
    if (typeof window !== 'undefined') window.hljs = hljs;
    document.addEventListener('DOMContentLoaded', () => {
        if (window.hljs) hljs._private.logDebug("DOM Content Loaded. Initiating hljs.highlightAll().");
        if (window.hljs) window.hljs.highlightAll();
    });
})();
