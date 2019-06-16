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
const deleteChar = (text, position) => {
    let caretShift = 0;
    if (position >= 0 && position < text.length)
    {
        const char = text[position];
        const status = char[0];
        switch (status) {
            case codeName.added:
                text.splice(position, 1);
                break;
            case codeName.normal:
                text.splice(position, 1, [codeName.deleted, char[1]]);
                break;
        }
        caretShift = -1;
    }
    return caretShift;
};
const deleteSelection = (text, caret) => {
    if (caret.type === "None") {
        console.error("No range to delete");
        return;
    }
    const left = caret.type === "Caret" ? caret.end - 1 : caret.start;
    const right = caret.end - 1;

    for (let i = right; i >= left; i--) {
        shiftCaret(deleteChar(text, i));
    }
    return right - left - 1;
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
                deleted = deleteChar(text, i);
            }
            break;
    }
    deleted && shiftCaret(text, deleted);
    return deleted;
};
const setCaret = (position) => {
    const el = document.getElementById('tracker');
    const range = document.createRange();
    const sel = window.getSelection();
    let offset = 0;
    const containerCount = el.childNodes.length;
    if (position >= containerCount) {
        position = containerCount - 1;
        offset = 1;
    }
    const container = el.childNodes[position];
    const textNode = container.childNodes[0];
    range.setStart(textNode, offset);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();
};
const getCaret = () => {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const caret = {
        type: selection.type,
        rangeCount: selection.rangeCount,
        start: +range.startContainer.parentElement.dataset['index'] + range.startOffset,
        end: +range.endContainer.parentElement.dataset['index'] + range.endOffset
    };
    return caret;
};
const shiftCaret = (text, shift) => {
    if (shift) {
        const position = getCaret().end;
        if (position + shift >= 0 && position + shift <= text.length) {
            setCaret(position + shift);
            return shift;
        }
    }
    return 0;
};

const app = new Vue({
    el: '#app',
    data: {
        caret: {
            start: null,
            end: null
        },
        formatted: [[codeName.normal, 'Hello, Vue.js '], [codeName.deleted, 'World'], [codeName.added, 'JS']],
        decomposed: null
    },
    computed: {},
    methods: {
        updateCaret: function() {
            this.caret = getCaret();
        },
        input: function(event) {
            if (event && !event.metaKey) {
                event.preventDefault();
            } else {
                return;
            }
        
            console.log("pressed", event.key, event);

            switch (event.key) {
                case 'ArrowLeft':
                    shiftCaret(this.decomposed, -1) && this.updateCaret();
                    break;
                case 'ArrowRight':
                    shiftCaret(this.decomposed, 1) && this.updateCaret();
                    break;
                case 'Enter':
                    clearSelection(this.decomposed, this.caret);
                    addChar(this.decomposed, '\n', this.caret.end);
                    shiftCaret(this.decomposed, 1) && this.updateCaret();
                    break;
                case 'Backspace':
                    const deleted = deleteSelection(this.decomposed, this.caret);
                    shiftCaret(this.decomposed, deleted) && this.updateCaret();
                    break;
                default:
                    if (event.key.length === 1) {
                        clearSelection(this.decomposed, this.caret);
                        addChar(this.decomposed, event.key, this.caret.end);
                        shiftCaret(this.decomposed, 1) && this.updateCaret();
                    } else {
                        console.log('non printable', event.key);
                    }
                break;
            }
        },
        paste: function(event) {
            event.preventDefault();
            const paste = (event.clipboardData || window.clipboardData).getData('text');
            console.log("paste:", paste);
        }
    },
    created() {
        this.decomposed = decompose(this.formatted);
    }
});

