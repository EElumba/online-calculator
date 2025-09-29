
if (window._calculatorInitialized) {
    
} else {
    window._calculatorInitialized = true;


    document.addEventListener('DOMContentLoaded', () => {
        const display = document.getElementById('display');
        const keys = document.getElementById('keys') || document.querySelector('.content');

        if (!display || !keys) {
            console.warn('Calculator: missing #display or #keys/.content in DOM');
            return;
        }

        //history panel elements
        const HISTORY_KEY = 'calculator-history';
        const historyPanel = document.getElementById('history-panel');
        const historyList = document.getElementById('history-list');
        const historyToggle = document.getElementById('history-toggle');
        const historyClear = document.getElementById('history-clear');

        let history = [];
        try {
            history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
            catch { history = [];}

            function saveHistory() {
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-50)));
            }

        function renderHistory() {
            if (!historyList) return;
            historyList.innerHTML = '';
            history.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                historyList.appendChild(li);
            });
        }

        function addHIstory(text){
            history.push(text);
            saveHistory();
            renderHistory();
        }

        if (historyPanel && historyToggle) {
            historyToggle.addEventListener('click', () => {
                historyPanel.hidden = !historyPanel.hidden;
            });
        }

        if (historyClear){
            historyClear.addEventListener('click', () => {
                history = [];
                saveHistory();
                renderHistory();
            });
        }
        renderHistory();


        //calculator state
        const state = {
            current: '0',
            previous: null,
            operator: null,
            overwrite: true,
            displayOverride: null,
        };

        function updateDisplay() {
            if (state.displayOverride !== null) {
                display.textContent = state.displayOverride;
                return;
            }

            let out = state.current;
            if (out === 'Error') {
                display.textContent = out;
                return;
            }
            if (out.length > 8) {
                const num = Number(out);
                if (Number.isFinite(num)) {
                    out = num.toPrecision(8).replace(/\.?0+e/, 'e'); 
                } else {
                    out = out.slice(0, 8);
                }
            }
            display.textContent = out;
        }

        function inputDigit(digit) {
            if (state.displayOverride !== null)state.displayOverride = null;

            if (state.overwrite) {
                state.current = (digit === '.') ? '0.' : String(digit);
                state.overwrite = false;
                return;
            }

            if (digit === '.') {
                if (!state.current.includes('.')) {
                    state.current += '.';
                }
                return;
            }

            state.current = (state.current === '0') ? String(digit) : state.current + String(digit);
        }

        function setOperator(op) {
            state.displayOverride = op;

            if (state.operator && !state.overwrite) {
                compute();
            } else {
                state.previous = parseFloat(state.current);
            }
            state.operator = op;
            state.overwrite = true;
        }

        function compute() {
            if (state.operator == null || state.previous == null) return;
            const p = state.previous;
            const current = parseFloat(state.current);
            let result = p;

            switch (state.operator) {
                case '+': result = p + current; break;
                case '-': result = p - current; break;
                case 'x': result = p * current; break;
                case '÷': result = (current === 0) ? 'Error' : p / current; break;
                default: return;
            }

            if (result !== 'Error' && Number.isFinite(result)){
                addHIstory(`${p} ${state.operator} ${current} = ${result}`);
            }

            if (result === 'Error' || !Number.isFinite(result)) {
                state.current = 'Error';
                state.previous = null;
                state.operator = null;
                state.overwrite = true;
                state.displayOverride = null;
                return;
            }

            state.current = String(result);
            state.previous = result;
            state.operator = null;
            state.overwrite = true;
            state.displayOverride = null;
        }

        function clearAll() {
            state.current = '0';
            state.previous = null;
            state.operator = null;
            state.overwrite = true;
            state.displayOverride = null;
        }

        function changeSign() {
            if (state.current === '0' || state.current === 'Error') return;
            state.displayOverride = null;
            state.current = state.current.startsWith('-') ? state.current.slice(1) : '-' + state.current;
            addHIstory(`${before} → ${state.current}`);
            updateDisplay();
        }

        function percent() {
            if (state.current === 'Error') return;
            state.displayOverride = null;
            const val = parseFloat(state.current);
            state.current = String(val / 100);
            state.overwrite = true;
            addHIstory(`${before} % = ${state.current}`);
            updateDisplay();
        }

        function deleteOperator() {
            if (state.operator != null) {
                state.operator = null;
                state.overwrite = false;
                state.displayOverride = null;
            }
        }

        function deleteDigit() {
            if (state.displayOverride !== null || (state.operator != null && state.overwrite)) {
                deleteOperator();
                updateDisplay();
                return;
            }

            if (state.current === 'Error'){
                state.current = '0';
            } else if (state.current.length > 1) {
                state.current = state.current.slice(0, -1);
            } else {
                state.current = '0';
            }
        }  

        const operatorMap = {
            'add': '+',
            'subtract': '-',
            'multiply': 'x',
            'divide': '÷'
        };

        keys.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            if (!keys.contains(button)) return;

            const digit = button.dataset.digit;
            const action = button.dataset.action;
            const id = button.id && button.id.toString();

            // digits via data-digit
            if (typeof digit !== 'undefined') {
                inputDigit(digit);
                updateDisplay();
                return;
            }

            // decimal (button id or data-action)
            if (id === 'decimal' || action === 'decimal' || button.textContent === '.') {
                inputDigit('.');
                updateDisplay();
                return;
            }

            // operators by id mapping or data-value
            if (operatorMap[id]) {
                setOperator(operatorMap[id]);
                updateDisplay();
                return;
            }

            // equals
            if (id === 'equals' || action === 'equals' || button.textContent === '=') {
                compute();
                updateDisplay();
                return;
            }

            // clear (AC)
            if (id === 'clear' || action === 'clear' || button.textContent.trim().toUpperCase() === 'AC') {
                clearAll();
                updateDisplay();
                return;
            }

            // delete (DEL)
            if (id === 'delete' || action === 'delete' || button.textContent.trim().toUpperCase() === 'DEL') {
                deleteDigit();
                updateDisplay();
            }
            else if (id === 'delete' || action === 'delete' || button.textContent.trim().toUpperCase() === 'DEL' && value != digit) {
                deleteOperator();
                updateDisplay();
                return;
            }

            // sign toggle (plus/minus) - note index.html uses id "plus/minus"
            if (id === 'plus/minus' || id === 'plusminus' || action === 'sign' || button.textContent === '+/-') {
                changeSign();
                updateDisplay();
                return;
            }

            // percent
            if (id === 'percent' || action === 'percent' || button.textContent.trim() === '%') {
                percent();
                updateDisplay();
                return;
            }
        });

        updateDisplay();
    });
}
