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
    return caretShift;
};
const deleteInterval = (text, positionStart, positionEnd) => {
    for (var i = positionEnd; i >= positionStart; i--) {
        deleteChar(text, i);
    }
    return positionStart - positionEnd - 1;
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
    return {
        start: +range.startContainer.parentElement.dataset['index'] + range.startOffset,
        end: +range.endContainer.parentElement.dataset['index'] + range.endOffset
    };
};
const shiftCaret = (text, shift) => {
    const position = getCaret().end;
    if (position + shift >= 0 && position + shift <= text.length) {
        setCaret(position + shift);
        return shift;
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
        formatted: [[codeName.normal, 'Hello, '], [codeName.deleted, 'World'], [codeName.added, 'JS']],
        decomposed: null
    },
    computed: {},
    methods: {
        updateCaret: function() {
            this.caret = getCaret();
        },
        input: function(event) {
            if (event) event.preventDefault();
            console.log("pressed", event.key, event);

            switch (event.key) {
                case 'ArrowLeft':
                    shiftCaret(this.decomposed, -1);
                    break;
                case 'ArrowRight':
                    shiftCaret(this.decomposed, 1);
                    break;
                case 'Enter':
                    addChar(this.decomposed, '\n', this.caret.end);
                    shiftCaret(this.decomposed, 1);
                    break;
                case 'Backspace':
                    deleteChar(this.decomposed, getCaret().end - 1);
                    shiftCaret(this.decomposed, -1);
                    break;
                default:
                    if (event.key.length === 1) {
                        deleteInterval(this.decomposed, this.caret.start, this.caret.end - 1);
                        addChar(this.decomposed, event.key, this.caret.end);
                        shiftCaret(this.decomposed, 1);
                    }
                break;
            }
        },
        paste: function(event) {
            console.log(event);
        }
    },
    created() {
        this.decomposed = decompose(this.formatted);
    }
});

