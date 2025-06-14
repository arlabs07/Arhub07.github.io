(function() {
    'use strict';

    // --- Core Utility Functions ---

    /**
     * Escapes HTML entities in a string. This is CRITICAL.
     * All raw code must be escaped before applying any highlighting spans.
     * This prevents browser from interpreting code as actual HTML, and ensures
     * only our injected <span> tags affect the display.
     * @param {string} text The raw text to escape.
     * @returns {string} The HTML-escaped text.
     */
    function escapeHtml(text) {
        if (typeof text !== 'string') {
            console.warn("escapeHtml received non-string input:", text);
            return String(text); // Coerce to string
        }
        return text.replace(/&/g, "&amp;")
                   .replace(/</g, "&lt;")
                   .replace(/>/g, "&gt;")
                   .replace(/"/g, "&quot;")
                   .replace(/'/g, "&#039;");
    }

    /**
     * Wraps a matched text segment with a span and a specified class.
     * @param {string} text The text content to wrap.
     * @param {string} className The CSS class name to apply (e.g., 'hljs-keyword').
     * @returns {string} The HTML string with the wrapped span.
     */
    function wrapSpan(text, className) {
        return `<span class="${className}">${text}</span>`;
    }

    /**
     * A highly optimized replacement function that processes a string by applying
     * an array of regex patterns in a defined order. It ensures that once a part
     * of the string is highlighted, it's generally not re-processed by subsequent patterns.
     *
     * @param {string} code The HTML-escaped code string to highlight.
     * @param {Array<Object>} patterns An array of pattern objects. Each object should have:
     * - `regex`: RegExp object for matching.
     * - `className`: String, the CSS class to apply.
     * - `customReplacer`: Function (optional). If provided, this function is called
     * instead of the default `wrapSpan`. It receives the current `code` string
     * and should return the modified string. This is useful for nested highlighting.
     * @returns {string} The HTML string with applied highlighting spans.
     */
    function applyPatterns(code, patterns) {
        let currentCode = code;

        // Use a placeholder to protect already highlighted parts from re-matching
        // This is a common strategy in regex-based highlighters.
        const PLACEHOLDER_PREFIX = '___HLJS_PLACEHOLDER_';
        let placeholderCounter = 0;
        const placeholders = {}; // Stores { placeholder: original_highlighted_html }

        // First pass: apply all patterns and replace highlighted parts with placeholders
        patterns.forEach(pattern => {
            if (pattern.customReplacer) {
                // Custom replacers are expected to handle their own escaping and span wrapping
                currentCode = pattern.customReplacer(currentCode, pattern.className || '');
            } else {
                currentCode = currentCode.replace(pattern.regex, (match, ...args) => {
                    // Check if the match already contains a placeholder or a highlighting span
                    if (match.includes(PLACEHOLDER_PREFIX) || match.includes('<span class="hljs-')) {
                        return match; // Already processed, return as is
                    }
                    const placeholder = PLACEHOLDER_PREFIX + (placeholderCounter++);
                    placeholders[placeholder] = wrapSpan(match, pattern.className);
                    return placeholder;
                });
            }
        });

        // Second pass: Replace placeholders with their actual highlighted HTML
        for (const placeholder in placeholders) {
            // Use a RegExp object for global replacement of the placeholder
            const placeholderRegex = new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            currentCode = currentCode.replace(placeholderRegex, placeholders[placeholder]);
        }

        return currentCode;
    }

    // --- Language Definitions ---
    // Each language is defined as an object with a `highlight` function.

    const _languages = {
        /**
         * JavaScript Language Highlighter.
         * Processes JS code with specific regex patterns for keywords, strings, comments, etc.
         * Attempts basic detection and highlighting of HTML/CSS within template literals (freestyle in code).
         * @param {string} code The HTML-escaped JavaScript code.
         * @returns {string} The highlighted HTML string.
         */
        js: function(code) {
            // Define patterns with precise order for JS
            const jsPatterns = [
                // Comments (multi-line first for precedence, then single-line)
                { regex: /(\/\*[\s\S]*?\*\/)/g, className: 'hljs-comment' },
                { regex: /(\/\/.*)/g, className: 'hljs-comment' },

                // Strings: double, single, and template literals (special handling for nested content)
                {
                    regex: /(`(?:[^`\\]|\\.)*`)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g,
                    customReplacer: (inputCode) => {
                        return inputCode.replace(/(`(?:[^`\\]|\\.)*`)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g, (match, backtickStr, doubleQuoteStr, singleQuoteStr) => {
                            if (backtickStr) {
                                // For template literals, extract content and attempt nested highlighting
                                let content = backtickStr.substring(1, backtickStr.length - 1); // Remove backticks
                                let highlightedContent = escapeHtml(content); // Default: just escape

                                // Attempt to detect HTML/CSS inside template literals for freestyle
                                const trimmedContent = content.trim();
                                if (trimmedContent.startsWith('<') && trimmedContent.endsWith('>')) {
                                    highlightedContent = _languages.html(content);
                                } else if (trimmedContent.includes(':') && trimmedContent.includes(';') && trimmedContent.includes('{')) { // Basic CSS heuristic
                                    highlightedContent = _languages.css(content);
                                } else {
                                    // Handle JavaScript interpolations: ${expression}
                                    highlightedContent = highlightedContent.replace(/(\$\{)([^{}]+)(\})/g, (m, openBrace, expr, closeBrace) => {
                                        // Recursively highlight the expression part as JS
                                        return wrapSpan(openBrace, 'hljs-operator') +
                                               _languages.js(expr) + // Recurse for inner JS
                                               wrapSpan(closeBrace, 'hljs-operator');
                                    });
                                    // Fallback freestyle for plain text within template literals
                                    highlightedContent = _languages.freestyle(content);
                                }
                                return wrapSpan('`' + highlightedContent + '`', 'hljs-string');
                            } else if (doubleQuoteStr || singleQuoteStr) {
                                return wrapSpan(match, 'hljs-string');
                            }
                            return match; // Should not happen
                        });
                    }
                },

                // Keywords (more comprehensive list for JS)
                { regex: /\b(await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield|undefined)\b/g, className: 'hljs-keyword' },
                // Numbers (integers, floats, hex, octal, binary)
                { regex: /\b(0x[0-9a-fA-F_]+|0o[0-7_]+|0b[01_]+|[0-9][0-9_]*(\.[0-9_]+)?([eE][+\-]?\d+)?)\b/g, className: 'hljs-number' },
                // Operators and punctuation (more exhaustive set)
                { regex: /(\+\+|--|===|!==|==|!=|<=|>=|<|>|=|!|\+=|-=|\*=|%=|\/=|&&|\|\||\?\?|\?|\:|\*|\/|%|\+|\-|\{|\}|\(|\)|\[|\]|;|,|\.|\=\>|=>)/g, className: 'hljs-operator' },
                // Function names (identifies a word followed by a parenthesis, not a keyword)
                {
                    regex: /\b([a-zA-Z_$][0-9a-zA-Z_$]*)(?=\s*\()/g,
                    className: 'hljs-title hljs-function',
                    customReplacer: (inputCode) => {
                        // Apply this only if the matched word is not already a keyword or part of a span
                        return inputCode.replace(/\b([a-zA-Z_$][0-9a-zA-Z_$]*)(?=\s*\()/g, (match, p1) => {
                            if (match.includes('<span class="hljs-') || _languages.js.keywordsRegex.test(p1)) {
                                return match; // Already highlighted or is a keyword
                            }
                            return wrapSpan(p1, 'hljs-title hljs-function');
                        });
                    }
                },
                // Properties / Object keys (words followed by a colon or dot)
                { regex: /\b([a-zA-Z_$][0-9a-zA-Z_$]*)(?=\s*:|\s*\.)/g, className: 'hljs-attr' },
                // Catch-all for remaining identifiers/variables
                // This should be one of the last patterns
                { regex: /\b([a-zA-Z_$][0-9a-zA-Z_$]*)\b/g, className: 'hljs-variable' }
            ];

            return applyPatterns(code, jsPatterns);
        },

        /**
         * HTML Language Highlighter.
         * Handles HTML tags, attributes, comments, and recursively highlights embedded CSS and JS.
         * @param {string} code The HTML-escaped HTML code.
         * @returns {string} The highlighted HTML string.
         */
        html: function(code) {
            // Regex patterns for HTML, ordered by precedence (blocks first, then general tags)
            const htmlPatterns = [
                // HTML Comments: <!-- ... --> (must be escaped first, so &lt;!--)
                { regex: /(&lt;!--[\s\S]*?--&gt;)/g, className: 'hljs-comment' },
                // DOCTYPE declaration
                { regex: /(&lt;!DOCTYPE\s+[^&gt;]*&gt;)/g, className: 'hljs-meta hljs-doctag' },
                // HTML Entities (e.g., &amp;, &lt;, &#x20AC;)
                { regex: /(&amp;[a-zA-Z0-9#]+;)/g, className: 'hljs-symbol' },

                // Script blocks (extract and highlight JS content recursively)
                {
                    regex: /(&lt;script([^&gt;]*)?&gt;)([\s\S]*?)(&lt;\/script&gt;)/g,
                    customReplacer: (inputCode) => {
                        return inputCode.replace(/(&lt;script([^&gt;]*)?&gt;)([\s\S]*?)(&lt;\/script&gt;)/g, (match, startTag, attrs, content, endTag) => {
                            // Highlight start and end tags as HTML
                            const highlightedStartTag = applyPatterns(startTag, [
                                {regex: /(&lt;)(\/?)([a-zA-Z0-9:]+)([^&gt;]*?)(\/?&gt;)/g, customReplacer: _highlightHtmlTagInternal}
                            ]);
                            const highlightedEndTag = applyPatterns(endTag, [
                                {regex: /(&lt;)(\/?)([a-zA-Z0-9:]+)([^&gt;]*?)(\/?&gt;)/g, customReplacer: _highlightHtmlTagInternal}
                            ]);
                            // Recursively highlight content as JavaScript
                            const highlightedContent = _languages.js(content);
                            return `${highlightedStartTag}${highlightedContent}${highlightedEndTag}`;
                        });
                    }
                },
                // Style blocks (extract and highlight CSS content recursively)
                {
                    regex: /(&lt;style([^&gt;]*)?&gt;)([\s\S]*?)(&lt;\/style&gt;)/g,
                    customReplacer: (inputCode) => {
                        return inputCode.replace(/(&lt;style([^&gt;]*)?&gt;)([\s\S]*?)(&lt;\/style&gt;)/g, (match, startTag, attrs, content, endTag) => {
                            const highlightedStartTag = applyPatterns(startTag, [
                                {regex: /(&lt;)(\/?)([a-zA-Z0-9:]+)([^&gt;]*?)(\/?&gt;)/g, customReplacer: _highlightHtmlTagInternal}
                            ]);
                            const highlightedEndTag = applyPatterns(endTag, [
                                {regex: /(&lt;)(\/?)([a-zA-Z0-9:]+)([^&gt;]*?)(\/?&gt;)/g, customReplacer: _highlightHtmlTagInternal}
                            ]);
                            // Recursively highlight content as CSS
                            const highlightedContent = _languages.css(content);
                            return `${highlightedStartTag}${highlightedContent}${highlightedEndTag}`;
                        });
                    }
                },
                // HTML Tags and Attributes (general pattern, applied after script/style blocks are extracted)
                {
                    regex: /(&lt;(\/?)([a-zA-Z0-9:-]+)([^&gt;]*?)(\/?&gt;))/g,
                    customReplacer: (inputCode) => {
                        return inputCode.replace(/(&lt;(\/?)([a-zA-Z0-9:-]+)([^&gt;]*?)(\/?&gt;))/g, (match, fullTag, slash, tagName, attributes, endBracket) => {
                            // Ensure parts are not already highlighted (e.g. from nested blocks)
                            if (fullTag.includes('<span class="hljs-')) {
                                return fullTag;
                            }

                            // Highlight the tag name and slash
                            let highlightedTag = wrapSpan(slash, 'hljs-operator') + wrapSpan(tagName, 'hljs-name');

                            // Highlight attributes (name="value" or name='value' or name)
                            let highlightedAttributes = attributes.replace(/([a-zA-Z0-9-]+)(?:(=)("(?:[^"\\]|\\.)*?"|'(?:[^'\\]|\\.)*?'))?/g, (attrMatch, attrName, eq, attrValue) => {
                                let parts = [];
                                parts.push(wrapSpan(attrName, 'hljs-attr'));
                                if (eq) {
                                    parts.push(wrapSpan(eq, 'hljs-operator'));
                                    parts.push(wrapSpan(attrValue, 'hljs-string'));
                                }
                                return parts.join('');
                            });

                             // Handle attributes without values (e.g., <input checked>)
                            highlightedAttributes = highlightedAttributes.replace(/(\s)([a-zA-Z0-9-]+)(?=\s*&gt;|\s*\/?&gt;|\s*[a-zA-Z0-9-]+=")/g, (m, space, attrName) => {
                                if (!attrName.includes('<span class="hljs-')) { // Avoid re-highlighting already processed parts
                                    return `${space}${wrapSpan(attrName, 'hljs-attr')}`;
                                }
                                return m;
                            });

                            // Handle self-closing slash (e.g., <img />)
                            highlightedAttributes = highlightedAttributes.replace(/(\s\/)/g, '<span class="hljs-operator">$1</span>');

                            return `&lt;${highlightedTag}${highlightedAttributes}&gt;`;
                        });
                    }
                }
            ];

            // Internal helper to highlight only the components of an HTML tag string
            // Used for script/style start/end tags where we just need the tag highlighted, not its content.
            function _highlightHtmlTagInternal(tagString) {
                return tagString.replace(/(&lt;)(\/?)([a-zA-Z0-9:]+)([^&gt;]*?)(\/?&gt;)/g, (match, lt, slash, tagName, attrs, gt) => {
                    let highlightedAttrs = attrs.replace(/([a-zA-Z0-9-]+)(=)("(?:[^"\\]|\\.)*?"|'(?:[^'\\]|\\.)*?')/g, (m, name, eq, val) => {
                        return wrapSpan(name, 'hljs-attr') + wrapSpan(eq, 'hljs-operator') + wrapSpan(val, 'hljs-string');
                    });
                    highlightedAttrs = highlightedAttrs.replace(/(\s)([a-zA-Z0-9-]+)(?=\s*&gt;|\s*\/?&gt;|\s*[a-zA-Z0-9-]+=")/g, (m, space, attrName) => {
                        return `${space}${wrapSpan(attrName, 'hljs-attr')}`;
                    });
                    highlightedAttrs = highlightedAttrs.replace(/(\s\/)/g, wrapSpan('$1', 'hljs-operator')); // Self-closing slash
                    return `${lt}${wrapSpan(slash, 'hljs-operator')}${wrapSpan(tagName, 'hljs-name')}${highlightedAttrs}${gt}`;
                });
            }

            return applyPatterns(code, htmlPatterns);
        },

        /**
         * CSS Language Highlighter.
         * Processes CSS code with patterns for selectors, properties, values, comments, etc.
         * @param {string} code The HTML-escaped CSS code.
         * @returns {string} The highlighted HTML string.
         */
        css: function(code) {
            // Define patterns for CSS with precedence
            const cssPatterns = [
                // Comments: /* ... */
                { regex: /(\/\*[\s\S]*?\*\/)/g, className: 'hljs-comment' },
                // @rules (e.g., @media, @import, @keyframes)
                { regex: /(\@(charset|import|namespace|media|supports|document|page|font-face|keyframes|viewport|custom-media|counter-style|font-feature-values|top-left-corner|top-left|top-center|top-right|top-right-corner|bottom-left-corner|bottom-left|bottom-center|bottom-right|bottom-right-corner))\b/g, className: 'hljs-meta' },
                // Strings (double and single quotes)
                { regex: /("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g, className: 'hljs-string' },
                // Numbers (with optional units)
                { regex: /\b(\d+(\.\d+)?(px|em|%|rem|vh|vw|ch|ex|pt|pc|in|cm|mm|deg|grad|rad|turn|ms|s|Hz|kHz)?)\b/g, className: 'hljs-number' },
                // !important keyword
                { regex: /\b(!important)\b/g, className: 'hljs-keyword' },
                // CSS Variables (custom properties --var-name)
                { regex: /(\-\-[a-zA-Z0-9_-]+)/g, className: 'hljs-variable' },
                // CSS Functions (e.g., url(), rgb(), calc())
                { regex: /\b([a-zA-Z-]+)\s*(\()([^)]*)(\))/g, className: '', customReplacer: (inputCode) => {
                    return inputCode.replace(/\b([a-zA-Z-]+)\s*(\()([^)]*)(\))/g, (match, funcName, openParen, args, closeParen) => {
                        // Recursively highlight arguments within functions
                        let highlightedArgs = args.replace(/("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g, wrapSpan('$1', 'hljs-string')); // Strings in args
                        highlightedArgs = highlightedArgs.replace(/\b(\d+(\.\d+)?(px|em|%)?)\b/g, wrapSpan('$1', 'hljs-number')); // Numbers in args
                        highlightedArgs = highlightedArgs.replace(/(:|,)/g, wrapSpan('$1', 'hljs-operator')); // Operators in args
                        return wrapSpan(funcName, 'hljs-function') + wrapSpan(openParen, 'hljs-operator') + highlightedArgs + wrapSpan(closeParen, 'hljs-operator');
                    });
                }},
                // Selectors (ID, Class, Tag, Pseudo-classes/elements, Combinators)
                {
                    regex: /(\#[a-zA-Z0-9_-]+)|(\.[a-zA-Z0-9_-]+)|([a-zA-Z-]+)|(:\w+)|(::\w+)|(\s*(?:[>+~]|\*)\s*)/g,
                    customReplacer: (inputCode) => {
                        return inputCode.replace(/(\#[a-zA-Z0-9_-]+)|(\.[a-zA-Z0-9_-]+)|([a-zA-Z-]+)|(:\w+)|(::\w+)|(\s*(?:[>+~]|\*)\s*)/g, (match, id, cls, tag, pseudoClass, pseudoElem, combinator) => {
                            if (id) return wrapSpan(match, 'hljs-selector-id');
                            if (cls) return wrapSpan(match, 'hljs-selector-class');
                            if (tag) return wrapSpan(match, 'hljs-selector-tag');
                            if (pseudoClass || pseudoElem) return wrapSpan(match, 'hljs-selector-pseudo');
                            if (combinator) return wrapSpan(match, 'hljs-operator');
                            return match;
                        });
                    }
                },
                // Properties (e.g., color, font-size, background-image)
                { regex: /\b([a-zA-Z-]+)(?=\s*:(?![=]))/g, className: 'hljs-property' }, // Ensure not capturing ==
                // Operators and punctuation (colon, semicolon, braces, comma)
                { regex: /(:|;|\{|\}|,)/g, className: 'hljs-operator' }
            ];

            return applyPatterns(code, cssPatterns);
        },

        /**
         * Freestyle Highlighter (Generic/Fallback).
         * Applies basic highlighting for common patterns like strings, numbers, and comments
         * to any text, useful when a specific language isn't detected or for non-code text.
         * @param {string} code The HTML-escaped text.
         * @returns {string} The highlighted HTML string.
         */
        freestyle: function(code) {
            const freestylePatterns = [
                // Generic comments (JS-style and HTML-style)
                { regex: /(\/\*[\s\S]*?\*\/)|(\/\/.*)|(&lt;!--[\s\S]*?--&gt;)/g, className: 'hljs-comment' },
                // Generic strings (double, single, backticks)
                { regex: /(`(?:[^`\\]|\\.)*`)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g, className: 'hljs-string' },
                // Numbers
                { regex: /\b(\d+(\.\d+)?)\b/g, className: 'hljs-number' },
                // Common literals/boolean-like words
                { regex: /\b(true|false|null|undefined)\b/g, className: 'hljs-literal' },
                // Basic operators/punctuation that often appear in config/data
                { regex: /(\+\+|--|===|!==|==|!=|<=|>=|<|>|=|!|\+=|-=|\*=|%=|\/=|&&|\|\||\?\?|\?|\:|\*|\/|%|\+|\-|\{|\}|\(|\)|\[|\]|;|,|\.)/g, className: 'hljs-operator' },
                // Property-like names (words followed by a colon or equals)
                { regex: /\b([a-zA-Z_$][0-9a-zA-Z_$]*)(?=\s*[:=])/g, className: 'hljs-attr' },
                // General variable-like words (catch-all, applied last)
                { regex: /\b([a-zA-Z_$][0-9a-zA-Z_$]*)\b/g, className: 'hljs-variable' }
            ];
            return applyPatterns(code, freestylePatterns);
        }
    };

    // Store common JS keywords regex for internal use by language functions
    _languages.js.keywordsRegex = /\b(await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield|undefined)\b/;


    // --- Core `hljs` API Implementation ---
    const hljs = {
        /**
         * Highlights all code blocks on the page.
         * Locates `<pre><code>` elements and delegates to `highlightElement`.
         * Mimics `hljs.highlightAll()` from original Highlight.js.
         * Includes robust error handling for each block.
         */
        highlightAll: function() {
            document.querySelectorAll('pre code').forEach((block) => {
                try {
                    this.highlightElement(block);
                } catch (error) {
                    console.error("Error highlighting code block:", block, error);
                    // Fallback to plain text if a block fails
                    block.innerHTML = escapeHtml(block.textContent);
                    block.classList.add('hljs'); // Still add base class for consistent styling
                    block.classList.add('hljs-error'); // Add error class
                }
            });
        },

        /**
         * Highlights a single DOM element containing code.
         * Determines language from element classes (`language-js`, `lang-css`, etc.).
         * Mimics `hljs.highlightElement(element)`.
         * @param {HTMLElement} element The `<code>` DOM element to highlight.
         */
        highlightElement: function(element) {
            const rawCode = element.textContent; // Get plain text content
            const classList = Array.from(element.classList);

            let languageId = 'freestyle'; // Default fallback

            // Try to detect language from common Highlight.js class names
            if (classList.includes('language-js') || classList.includes('lang-js') || classList.includes('javascript')) {
                languageId = 'js';
            } else if (classList.includes('language-html') || classList.includes('lang-html') || classList.includes('xml') || classList.includes('markup')) {
                languageId = 'html';
            } else if (classList.includes('language-css') || classList.includes('lang-css')) {
                languageId = 'css';
            }
            // Add more `else if` for other languages as you extend `_languages`

            try {
                const result = this.highlight(rawCode, { language: languageId });
                element.innerHTML = result.value;
                element.classList.add('hljs'); // Add the base highlight.js class for theme compatibility
                element.setAttribute('data-highlighted-language', result.language); // Indicate detected language
            } catch (error) {
                console.error(`Failed to highlight element with language '${languageId}':`, element, error);
                // Fallback: display plain escaped text if highlighting fails for this element
                element.innerHTML = escapeHtml(rawCode);
                element.classList.add('hljs');
                element.classList.add('hljs-error');
            }
        },

        /**
         * Programmatically highlights a string of code.
         * Mimics `hljs.highlight(codeString, { language: 'lang' })`.
         * @param {string} codeString The raw code string to highlight.
         * @param {Object} options Options object. `language` is the primary option.
         * @param {string} options.language The language ID (e.g., 'js', 'html', 'css', 'freestyle').
         * @returns {Object} An object mimicking Highlight.js's return, with `value` (highlighted HTML) and `language`.
         */
        highlight: function(codeString, options) {
            const requestedLangId = options && options.language ? options.language.toLowerCase() : 'freestyle';
            let highlightedValue = '';
            let finalLanguageId = requestedLangId;

            // Ensure input is a string
            const safeCodeString = typeof codeString === 'string' ? codeString : String(codeString);

            try {
                if (_languages[requestedLangId]) {
                    highlightedValue = _languages[requestedLangId](escapeHtml(safeCodeString));
                } else {
                    console.warn(`Language '${requestedLangId}' not found. Falling back to freestyle highlighting.`);
                    highlightedValue = _languages.freestyle(escapeHtml(safeCodeString));
                    finalLanguageId = 'freestyle';
                }
            } catch (error) {
                console.error(`Error during programmatic highlight for language '${requestedLangId}':`, error);
                highlightedValue = escapeHtml(safeCodeString); // Fallback to plain escaped text on error
                finalLanguageId = 'error-fallback';
            }

            return {
                value: highlightedValue,
                language: finalLanguageId,
                relevance: 0, // Not calculated in this basic version
                top: null,    // Not implemented
                illegal: false // Not explicitly detected
            };
        },

        /**
         * A placeholder for the `configure` method. In a real Highlight.js, this
         * allows setting global options. Here, it simply logs a warning.
         * @param {Object} options Configuration options.
         */
        configure: function(options) {
            console.warn("Custom hljs.configure() is a placeholder and does not implement full functionality.");
            // Future enhancement: you could process a `cssSelector` option here
            // if you wanted to change the default selector from 'pre code'.
        },

        // --- Internal/Debugging Access ---
        // Exposing these for debugging or future extension, not part of public API
        _private: {
            languages: _languages, // Access to individual language highlighters
            escapeHtml: escapeHtml, // Utility function
            applyPatterns: applyPatterns // Core pattern application logic
        }
    };

    // --- Global Exposure ---
    // Expose your custom highlight.js object globally under `window.hljs`.
    // This allows it to act as a direct replacement for the official library.
    if (typeof window !== 'undefined') {
        window.hljs = hljs;
    } else {
        console.warn("Not running in a browser environment. hljs will not be exposed globally.");
    }

    // --- Auto-Initialization on DOM Ready ---
    // Automatically highlights all code blocks on page load, mimicking default hljs behavior.
    document.addEventListener('DOMContentLoaded', () => {
        if (window.hljs) {
            console.log("DOM Content Loaded. Initiating hljs.highlightAll().");
            window.hljs.highlightAll();
        } else {
            console.error("hljs object not found on window. Auto-highlighting failed.");
        }
    });

})(); // End of IIFE

