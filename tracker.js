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
        default:
            throw Exception("Caret type is not supported");

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
            displayCaret(text, caret.end - 1);
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
    const x = rect.left + useRightBound * rect.width;
    const y = rect.top;
    return {
        x,
        y,
    };
};
const getCaretFromClick = (mouseEvent, caret, charCount) => {
    const target = mouseEvent.target;
    if (!target.classList.contains("letter"))
    {
        return {
            start: charCount,
            end: charCount,
            type: "Caret",
        };
    }

    const rect = mouseEvent.target.getBoundingClientRect();
    const letterX = mouseEvent.x - target.offsetLeft;
    const closerToRight = Math.round(letterX / rect.width);
    const targetIndex = Number(target.dataset["index"]);
    const position = targetIndex + closerToRight;

    return {
        start: position,
        end: position,
        type: "Caret",
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
    return shifted;
};
const processKey = (text, key, caret, shiftQueue) => {
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
        caretPosition: {
            x: 0,
            y: 0,
        },
        //formatted: [[codeName.normal, 'Hello, Vue.js '], [codeName.deleted, 'World'], [codeName.added, 'JS']],
        formatted: [[codeName.normal, 'Hi']],
        decomposed: null
    },
    updated: function () {
        this.$nextTick(function () {
            if (this.caretUpdateRequired) {
                const spans = document.getElementsByClassName('letter');
                console.log('caret should be shifted');
                if (this.caret.end <= spans.length) {
                    this.caretPosition = getCaretCoordinates(this.caret, spans);
                    this.caretUpdateRequired = false;
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
        doubleClick: function(event) {
            console.log('double click', event);
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
                case 'Backspace':
                    deleteSelection(this.decomposed, this.caret);
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
                break;
            }

            //update real caret position
            const spans = document.getElementsByClassName('letter')
            if (this.caret.end <= spans.length) {
                this.caretPosition = getCaretCoordinates(this.caret, spans);
            } else {
                this.caretUpdateRequired = true; 
                console.log('can not be set now, wait..')
            }
        },
        paste: function(event) {
            event.preventDefault();
            const paste = (event.clipboardData || window.clipboardData).getData('text');
            console.log("paste:", paste);
            for (var i = 0; i < paste.length; i++) {
              processKey(this.decomposed, paste.charAt(i), this.caret);
            }
        },
        focusTracker: function() {
            document.getElementById('tracker').focus();
        }
    },
    created() {
        this.decomposed = decompose(this.formatted);
    }
});

