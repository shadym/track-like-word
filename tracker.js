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

    }
    deleted && shiftCaret(text, caret, deleted);
    console.log("deleted", deleted);
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
                deleted = deleteChar(text, i);
            }
            setCaret(caret.end - 1);
            break;
    }
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
const shiftCaret = (text, caret, shift) => {
    let shifted = 0;
    if (shift) {
        const position = caret.end;
        if (position + shift >= 0 && position + shift <= text.length) {
            setCaret(position + shift);
            shifted = shift;
        }
    }
    console.log("shifted", shifted);
    return shifted;
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
                    shiftCaret(this.decomposed, this.caret, -1);
                    break;
                case 'ArrowRight':
                    shiftCaret(this.decomposed, this.caret, 1);
                    break;
                case 'Enter':
                    clearSelection(this.decomposed, this.caret);
                    addChar(this.decomposed, '\n', this.caret.end);
                    shiftCaret(this.decomposed, this.caret, 1);
                    break;
                case 'Backspace':
                    deleteSelection(this.decomposed, this.caret);
                    break;
                default:
                    if (event.key.length === 1) {
                        clearSelection(this.decomposed, this.caret);
                        addChar(this.decomposed, event.key, this.caret.end);
                        shiftCaret(this.decomposed, this.caret, 1);
                    } else {
                        console.log('non printable', event.key);
                    }
                break;
            }

            this.updateCaret();
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

