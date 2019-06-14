const codeName = {
    'normal': 'normal',
    'added': 'added',
    'deleted': 'deleted'
};
const decompose = (formatted) => formatted.reduce((chars, chunk) => {
    return chars.concat(chunk[1].split('').map((char) => [codeName[chunk[0]], char]));
}, []);
const processChar = (char, prev, caret) => {
    var next = [];
    for (var i = 0; i < caret.start; i++) {
        next.push(prev[i]);
    }
    for (var i = caret.start; i < caret.end; i++) {
        if (prev[i][0] == codeName.deleted) {
            next.push(prev[i]);
        } else if (prev[i][0] == codeName.normal) {
            const deleted = [codeName.deleted, prev[i][1]];
            next.push(deleted);
        }
    }
    next.push([codeName.added, char]);
    for (var i = caret.end; i < prev.length; i++) {
        next.push(prev[i]);
    }
    return next;
};
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
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(el.childNodes[position], 1);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus();
    return position + 1;
}
const getCaret = () => {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    return {
        start: +range.startContainer.parentElement.dataset['index'] + range.startOffset,
        end: +range.endContainer.parentElement.dataset['index'] + range.endOffset
    };
}

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
                    setCaret(getCaret().start - 1);
                    break;
                case 'ArrowRight':
                    setCaret(getCaret().end + 1);
                    break;
                case 'Enter':
                    addChar(this.decomposed, '\n', this.caret);
                    break;
                case 'Backspace':
                    deleteChar(this.decomposed, getCaret().end - 1);
                    break;
                default:
                    if (event.key.length === 1) {
                        deleteInterval(this.decomposed, this.caret.start, this.caret.end);
                        addChar(this.decomposed, event.key, this.caret.end);
                        this.caret.start = setCaret(this.caret.end);
                        this.caret.end = this.caret.start;
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

