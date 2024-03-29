const codeName = {
    'normal': 'normal',
    'added': 'added',
    'deleted': 'deleted'
};
const decompose = (formatted) => formatted.reduce((chars, chunk) => {
    return chars.concat(chunk[1].split('').map((char) => [codeName[chunk[0]], char]));
}, []);
const addChar = (text, char, position) => {
    text.splice(position, 0, [codeName.added, char]);
};
const deleteChar = (text, position, isClearing) => {
    let caretShift = 0;
    if (position >= 0 && position < text.length)
    {
        const char = text[position];
        const status = char[0];
        switch (status) {
            case codeName.added:
                text.splice(position, 1);
                caretShift = -1;
                break;
            case codeName.normal:
                text.splice(position, 1, [codeName.deleted, char[1]]);
                caretShift = isClearing ? 0 : -1;
                break;
            case codeName.deleted:
                caretShift = isClearing ? 0 : -1;
                break;
        }
    }
    return caretShift;
};
const deleteSelection = (text, caret) => {
    let deleted = 0;

    switch (caret.type) {
        case "None":
            console.error("No range to delete");
            break;
        case "Caret":
            deleted = deleteChar(text, caret.end - 1);
            break;
        case "Range":
            const left = caret.start;
            const right = caret.end - 1;
            for (let i = right; i >= left; i--) {
                deleteChar(text, i);
            }
            deleted = left - right - 1;
            break;
        default:
            throw Exception("Caret type is not supported");

    }
    deleted && shiftCaret(text, caret, deleted);
    return deleted;
};
const clearSelection = (text, caret) => {
    let deleted = 0;

    switch (caret.type) {
        case "None":
            console.error("No range to clear");
            break;
        case "Caret":
            break;
        case "Range":
            const left = caret.start;
            const right = caret.end - 1;    
            for (let i = right; i >= left; i--) {
                let d = deleteChar(text, i, true);
                deleted += d;
            }
            shiftCaret(text, caret, deleted);
            break;
    }
    return deleted;
};
const getCaretCoordinates = (caret, spans) => {
    let caretPosition = caret.end;
    let useRightBound = 0;
    if (caretPosition === spans.length) {
        caretPosition = spans.length - 1;
        useRightBound = 1;
    }
    const target = spans[caretPosition];
    const rect = target.getBoundingClientRect();
    let x = rect.x + useRightBound * rect.width;
    let y = rect.top;
    if (target.classList.contains("new-line")) {
        x = spans[0].getBoundingClientRect().x;
        y = rect.bottom;
    }
    return {
        x,
        y,
    };
};
const getCaretFromClick = (mouseEvent, caret, charCount) => {
    const target = mouseEvent.target;
    var selection = document.getSelection();
    let start = caret.start;
    let end = caret.end;
    switch (selection.type) {
        case "Range":
            var range = selection.rangeCount && selection.getRangeAt(0);
            start = +range.startContainer.parentNode.dataset["index"] + range.startOffset;
            end = +range.endContainer.parentNode.dataset["index"] + range.endOffset;
            break;
        case "Caret":
        case "None":
            if (!target.classList.contains("letter"))
            {
                start = charCount;
                end = charCount;
            } else {
                const rect = mouseEvent.target.getBoundingClientRect();
                const letterX = mouseEvent.x - target.offsetLeft;
                const closerToRight = Math.round(letterX / rect.width);
                const targetIndex = Number(target.dataset["index"]);
                const position = targetIndex + closerToRight;
                start = position;
                end = position;
            }

            break;
        default:
            console.log("No caret",selection, mouseEvent);
            break;
    }
    
    return {
        start,
        end,
        type: selection.type,
    };
};
const shiftCaret = (text, caret, shift) => {
    let shifted = 0;
    if (shift) {
        const position = caret.end;
        const newPosition = position + shift;
        if (newPosition >= 0 && newPosition <= text.length) {
            shifted = shift;
        }
    }
    caret.end += shifted;
    caret.start = caret.end;
    caret.type = "Caret";
    return shifted;
};
const emptySelection = () => {
    var sel = window.getSelection ? window.getSelection() : document.selection;
    if (sel) {
        if (sel.removeAllRanges) {
            sel.removeAllRanges();
        } else if (sel.empty) {
            sel.empty();
        }
    }
};
const processKey = (text, key, caret) => {
    clearSelection(text, caret);
    addChar(text, key, caret.end);
    shiftCaret(text, caret, 1);
};
const codeFor = {
    'Tab': '\t',
    'Enter': '\n',
};

const app = new Vue({
    el: '#app',
    data: {
        caret: {
            start: null,
            end: null,
        },
        caretUpdateRequired: false,
        caretVisible: true,
        caretPosition: {
            x: 0,
            y: 0,
        },
        //formatted: [[codeName.normal, 'Hello, Vue.js '], [codeName.deleted, 'World'], [codeName.added, 'JS']],
        formatted: [[codeName.normal, '0123456789']],
        decomposed: null
    },
    updated: function () {
        this.$nextTick(function () {
            if (this.caretUpdateRequired) {
                const spans = document.getElementsByClassName('letter');
                if (this.caret.end <= spans.length) {
                    this.caretPosition = getCaretCoordinates(this.caret, spans);
                    this.caretUpdateRequired = false;
                    if (this.caret.type == "Caret") {
                        emptySelection();
                    }
                } else {
                    debugger;
                }
            }
        })
    },
    methods: {
        updateCaret: function(event) {
            this.caret = getCaretFromClick(event, this.caret, this.decomposed.length);
            const rendered = document.getElementsByClassName('letter');
            this.caretPosition = getCaretCoordinates(this.caret, rendered)
        },
        hideCaret: function() {
            this.caretVisible = false;
        },
        showCaret: function() {
            this.caretVisible = true;
        },
        input: function(event) {
            if (event && !event.metaKey) {
                event.preventDefault();
            } else {
                return;
            }
        
            switch (event.key) {
                case 'ArrowLeft':
                    shiftCaret(this.decomposed, this.caret, -1);
                    break;
                case 'ArrowRight':
                    shiftCaret(this.decomposed, this.caret, 1);
                    break;
                case 'Backspace':
                    const deleted = deleteSelection(this.decomposed, this.caret);
                    this.caretUpdateRequired = !!deleted;
                    break;
                case 'Tab':
                case 'Enter':
                default:
                    const key = event.key in codeFor ? codeFor[event.key] : event.key;
                    if (key.length === 1) {
                        processKey(this.decomposed, key, this.caret);
                    } else {
                        console.log('non printable', key);
                    }
                    this.caretUpdateRequired = true;
                break;
            }

            if (!this.caretUpdateRequired) {
                const spans = document.getElementsByClassName('letter');
                this.caretPosition = getCaretCoordinates(this.caret, spans);
                if (this.caret.type == "Caret") {
                    emptySelection();
                }
            }
        },
        paste: function(event) {
            event.preventDefault();
            const paste = (event.clipboardData || window.clipboardData).getData('text');
            console.log("paste:", paste);
            for (var i = 0; i < paste.length; i++) {
                processKey(this.decomposed, paste.charAt(i), this.caret);
            }

            this.caretUpdateRequired = true;
        },
        focusTracker: function() {
            document.getElementById('tracker').focus();
        }
    },
    created() {
        this.decomposed = decompose(this.formatted);
    }
});

