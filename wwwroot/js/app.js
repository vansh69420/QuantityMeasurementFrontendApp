(function () {
  'use strict';

  const MeasurementType = Object.freeze({
    Length: 1,
    Weight: 2,
    Volume: 3,
    Temperature: 4
  });

  const ActionType = Object.freeze({
    Comparison: 'comparison',
    Conversion: 'conversion',
    Arithmetic: 'arithmetic'
  });

  const ArithmeticOp = Object.freeze({
    Add: 'add',
    Subtract: 'subtract',
    Divide: 'divide'
  });

  const UnitCatalog = Object.freeze({
    [MeasurementType.Length]: [
      { value: 'feet', label: 'Feet' },
      { value: 'inch', label: 'Inch' },
      { value: 'yard', label: 'Yard' },
      { value: 'centimeter', label: 'Centimeter' }
    ],
    [MeasurementType.Weight]: [
      { value: 'kg', label: 'Kilogram (kg)' },
      { value: 'g', label: 'Gram (g)' },
      { value: 'pound', label: 'Pound' }
    ],
    [MeasurementType.Volume]: [
      { value: 'litre', label: 'Litre' },
      { value: 'millilitre', label: 'Millilitre' },
      { value: 'gallon', label: 'Gallon' }
    ],
    [MeasurementType.Temperature]: [
      { value: 'celsius', label: 'Celsius' },
      { value: 'fahrenheit', label: 'Fahrenheit' },
      { value: 'kelvin', label: 'Kelvin' }
    ]
  });

  const TypeCards = Object.freeze([
    { type: MeasurementType.Length, label: 'Length', icon: '/assets/length.svg' },
    { type: MeasurementType.Weight, label: 'Weight', icon: '/assets/weight.svg' },
    { type: MeasurementType.Temperature, label: 'Temperature', icon: '/assets/temperature.svg' },
    { type: MeasurementType.Volume, label: 'Volume', icon: '/assets/volume.svg' }
  ]);

  const Actions = Object.freeze([
    { key: ActionType.Comparison, label: 'Comparison' },
    { key: ActionType.Conversion, label: 'Conversion' },
    { key: ActionType.Arithmetic, label: 'Arithmetic' }
  ]);

  let state = {
    measurementType: MeasurementType.Length,
    action: ActionType.Comparison,
    op: ArithmeticOp.Add,
    result: null,
    error: null,
    user: null
  };

  let debounceTimer = null;

  document.addEventListener('DOMContentLoaded', async () => {
    // Boot: ensure we have an access token in memory (via refresh cookie).
    const refresh = await window.qm.api.refreshAccessToken();

    if (!refresh.ok) {
      window.location.href = '/auth.html';
      return;
    }

    state.user = refresh.data;
    renderUserMeta();
    renderTypeCards();
    renderActions();
    renderActionArea();
  });

  function renderUserMeta() {
    const meta = document.getElementById('userMeta');
    if (!meta) return;

    if (!state.user || !state.user.username) {
      meta.textContent = '';
      return;
    }

    meta.textContent = `${state.user.username} (${state.user.role || 'User'})`;
  }

  function renderTypeCards() {
    const grid = document.getElementById('typeGrid');
    grid.innerHTML = '';

    TypeCards.forEach(card => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'typeCard' + (card.type === state.measurementType ? ' isSelected' : '');
      el.addEventListener('click', () => {
        state.measurementType = card.type;

        // Disable arithmetic for temperature
        if (state.measurementType === MeasurementType.Temperature && state.action === ActionType.Arithmetic) {
          state.action = ActionType.Conversion;
          toast('Arithmetic is disabled for Temperature.');
        }

        state.result = null;
        state.error = null;

        renderTypeCards();
        renderActions();
        renderActionArea();
      });

      el.innerHTML = `
        <div class="typeCard__inner">
          <img class="typeCard__icon" src="${card.icon}" alt="${card.label}" />
          <div class="typeCard__label">${card.label}</div>
        </div>
      `;

      grid.appendChild(el);
    });
  }

  function renderActions() {
    const seg = document.getElementById('actionSegment');
    seg.innerHTML = '';

    Actions.forEach(a => {
      const btn = document.createElement('button');
      btn.type = 'button';

      const isTemp = state.measurementType === MeasurementType.Temperature;
      const isDisabled = isTemp && a.key === ActionType.Arithmetic; // per your requirement

      btn.className = 'segmentBtn'
        + (a.key === state.action ? ' isActive' : '')
        + (isDisabled ? ' isDisabled' : '');

      btn.textContent = a.label;
      btn.disabled = isDisabled;

      btn.addEventListener('click', () => {
        if (isDisabled) return;
        state.action = a.key;
        state.result = null;
        state.error = null;
        renderActions();
        renderActionArea();
      });

      seg.appendChild(btn);
    });
  }

  function renderActionArea() {
    const area = document.getElementById('actionArea');
    area.innerHTML = '';

    if (state.action === ActionType.Comparison) {
      area.appendChild(renderComparison());
      return;
    }

    if (state.action === ActionType.Conversion) {
      area.appendChild(renderConversion());
      return;
    }

    area.appendChild(renderArithmetic());
  }

  function renderComparison() {
    const root = document.createElement('div');

    root.appendChild(renderTwoPanels('FROM', 'TO', {
      leftDefaultValue: 1,
      rightDefaultValue: 12
    }));

    const resultBox = renderResultBox();
    root.appendChild(resultBox);

    // auto-calc on change
    wireAutoCalculate(root, async (inputs) => {
      const payload = {
        firstQuantityDto: {
          measurementType: state.measurementType,
          firstValue: inputs.leftValue,
          firstUnitText: inputs.leftUnit
        },
        secondQuantityDto: {
          measurementType: state.measurementType,
          firstValue: inputs.rightValue,
          firstUnitText: inputs.rightUnit
        }
      };

      const res = await window.qm.api.requestJson('POST', '/api/quantity/compare', payload);
      handleQuantityResponse(res);
      updateResultBox(resultBox);
    });

    updateResultBox(resultBox);
    return root;
  }

  function renderConversion() {
    const root = document.createElement('div');

    const panels = renderTwoPanels('FROM', 'TO', {
      leftDefaultValue: 1,
      rightReadonly: true,
      rightShowSelect: true
    });

    root.appendChild(panels);

    const resultBox = renderResultBox();
    root.appendChild(resultBox);

    wireAutoCalculate(root, async (inputs) => {
      const payload = {
        quantityDto: {
          measurementType: state.measurementType,
          firstValue: inputs.leftValue,
          firstUnitText: inputs.leftUnit
        },
        targetUnitText: inputs.rightUnit
      };

      const res = await window.qm.api.requestJson('POST', '/api/quantity/convert', payload);
      handleQuantityResponse(res);

      // For conversion, also write into TO value field (read-only)
      const toInput = root.querySelector('[data-qm="rightValue"]');
      if (toInput && state.result && state.result.resultValue !== undefined && state.result.resultValue !== null) {
        toInput.value = String(state.result.resultValue);
      }

      updateResultBox(resultBox);
    });

    updateResultBox(resultBox);
    return root;
  }

  function renderArithmetic() {
    const root = document.createElement('div');

    const panels = document.createElement('div');
    panels.className = 'formRow';

    const left = renderValuePanel('VALUE 1', 'left', 1);
    const opBox = renderOpBox();
    const right = renderValuePanel('VALUE 2', 'right', 1);

    panels.appendChild(left);
    panels.appendChild(opBox);
    panels.appendChild(right);

    // Make it 3 columns visually on wide screens by placing op in middle
    panels.style.gridTemplateColumns = '1fr 120px 1fr';

    root.appendChild(panels);

    // Target unit + result (like screenshot)
    const resultBox = renderResultBox(true);
    root.appendChild(resultBox);

    const footer = document.createElement('div');
    footer.className = 'actionFooter';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'primaryBtn';
    btn.textContent = 'Calculate';
    btn.addEventListener('click', async () => {
      await calculateArithmetic(root);
      updateResultBox(resultBox);
    });

    footer.appendChild(btn);
    root.appendChild(footer);

    updateResultBox(resultBox);
    return root;
  }

  async function calculateArithmetic(root) {
    const inputs = readInputs(root);

    if (!inputs) return;

    let endpoint = '/api/quantity/add';
    if (state.op === ArithmeticOp.Subtract) endpoint = '/api/quantity/subtract';
    if (state.op === ArithmeticOp.Divide) endpoint = '/api/quantity/divide';

    const payload = {
      firstQuantityDto: {
        measurementType: state.measurementType,
        firstValue: inputs.leftValue,
        firstUnitText: inputs.leftUnit
      },
      secondQuantityDto: {
        measurementType: state.measurementType,
        firstValue: inputs.rightValue,
        firstUnitText: inputs.rightUnit
      }
    };

    // add/subtract support targetUnitText (optional)
    if (state.op !== ArithmeticOp.Divide) {
      payload.targetUnitText = inputs.targetUnit;
    }

    const res = await window.qm.api.requestJson('POST', endpoint, payload);
    handleQuantityResponse(res);
  }

  function renderTwoPanels(leftLabel, rightLabel, options) {
    const opts = options || {};
    const row = document.createElement('div');
    row.className = 'formRow';

    const left = renderValuePanel(leftLabel, 'left', opts.leftDefaultValue ?? 1, false, true);
    const right = renderValuePanel(rightLabel, 'right', opts.rightDefaultValue ?? '', opts.rightReadonly ?? false, opts.rightShowSelect ?? true);

    row.appendChild(left);
    row.appendChild(right);

    return row;
  }

  function renderValuePanel(title, side, defaultValue, readOnly, showSelect) {
    const panel = document.createElement('div');
    panel.className = 'panel';

    const label = document.createElement('div');
    label.className = 'panel__label';
    label.textContent = title;

    const body = document.createElement('div');
    body.className = 'panel__body';

    const input = document.createElement('input');
    input.className = 'valueInput';
    input.type = 'number';
    input.step = 'any';
    input.value = defaultValue;
    input.placeholder = '0';
    input.readOnly = !!readOnly;
    input.setAttribute('data-qm', side === 'left' ? 'leftValue' : 'rightValue');

    const select = document.createElement('select');
    select.className = 'select';
    select.setAttribute('data-qm', side === 'left' ? 'leftUnit' : 'rightUnit');

    if (!showSelect) select.style.display = 'none';

    fillUnits(select);

    body.appendChild(input);
    body.appendChild(select);

    panel.appendChild(label);
    panel.appendChild(body);

    return panel;
  }

  function renderOpBox() {
    const panel = document.createElement('div');
    panel.className = 'panel';

    const label = document.createElement('div');
    label.className = 'panel__label';
    label.textContent = 'OP';

    const body = document.createElement('div');
    body.className = 'panel__body';

    const ops = document.createElement('div');
    ops.className = 'inlineOps';

    const btnAdd = createOpBtn('+', ArithmeticOp.Add);
    const btnSub = createOpBtn('−', ArithmeticOp.Subtract);
    const btnDiv = createOpBtn('÷', ArithmeticOp.Divide);

    ops.appendChild(btnAdd);
    ops.appendChild(btnSub);
    ops.appendChild(btnDiv);

    body.appendChild(ops);
    panel.appendChild(label);
    panel.appendChild(body);

    return panel;
  }

  function createOpBtn(text, op) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opBtn' + (state.op === op ? ' isActive' : '');
    btn.textContent = text;

    btn.addEventListener('click', () => {
      state.op = op;
      state.result = null;
      state.error = null;
      renderActionArea();
    });

    return btn;
  }

  function fillUnits(selectEl) {
    const units = UnitCatalog[state.measurementType] || [];
    selectEl.innerHTML = '';

    units.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.value;
      opt.textContent = u.label;
      selectEl.appendChild(opt);
    });

    // default selections to match tests / common usage
    if (state.measurementType === MeasurementType.Length) {
      selectEl.value = selectEl.getAttribute('data-qm')?.includes('right') ? 'inch' : 'feet';
    }
    if (state.measurementType === MeasurementType.Weight) {
      selectEl.value = selectEl.getAttribute('data-qm')?.includes('right') ? 'g' : 'kg';
    }
    if (state.measurementType === MeasurementType.Volume) {
      selectEl.value = selectEl.getAttribute('data-qm')?.includes('right') ? 'millilitre' : 'litre';
    }
    if (state.measurementType === MeasurementType.Temperature) {
      selectEl.value = selectEl.getAttribute('data-qm')?.includes('right') ? 'fahrenheit' : 'celsius';
    }
  }

  function renderResultBox(includeTargetSelect) {
    const box = document.createElement('div');
    box.className = 'resultBox';

    const left = document.createElement('div');
    left.className = 'resultBox__left';

    const title = document.createElement('div');
    title.className = 'resultBox__title';
    title.textContent = 'RESULT';

    const value = document.createElement('div');
    value.className = 'resultBox__value';
    value.textContent = '-';
    value.setAttribute('data-qm', 'resultValue');

    const meta = document.createElement('div');
    meta.className = 'resultBox__meta';
    meta.textContent = '';
    meta.setAttribute('data-qm', 'resultMeta');

    left.appendChild(title);
    left.appendChild(value);
    left.appendChild(meta);

    box.appendChild(left);

    if (includeTargetSelect) {
      const target = document.createElement('select');
      target.className = 'select';
      target.style.maxWidth = '220px';
      target.setAttribute('data-qm', 'targetUnit');

      fillUnits(target);

      box.appendChild(target);
    }

    return box;
  }

  function updateResultBox(box) {
    const valueEl = box.querySelector('[data-qm="resultValue"]');
    const metaEl = box.querySelector('[data-qm="resultMeta"]');

    if (!valueEl || !metaEl) return;

    if (state.error) {
      valueEl.textContent = 'Error';
      metaEl.textContent = state.error;
      metaEl.style.color = '#cc2e2e';
      return;
    }

    metaEl.style.color = '#6b748c';

    if (!state.result) {
      valueEl.textContent = '-';
      metaEl.textContent = '';
      return;
    }

    // Compare result
    if (state.result.equalityResult !== undefined && state.result.equalityResult !== null) {
      valueEl.textContent = state.result.equalityResult ? 'TRUE' : 'FALSE';
      metaEl.textContent = 'Comparison result';
      return;
    }

    // Divide scalar
    if (state.result.scalarResult !== undefined && state.result.scalarResult !== null) {
      valueEl.textContent = String(state.result.scalarResult);
      metaEl.textContent = 'Division (scalar)';
      return;
    }

    // Convert/Add/Subtract result
    if (state.result.resultValue !== undefined && state.result.resultValue !== null) {
      valueEl.textContent = String(state.result.resultValue);

      const unit = state.result.resultUnitText ? ` ${state.result.resultUnitText}` : '';
      metaEl.textContent = `Unit:${unit || ' -'}`;

      return;
    }

    valueEl.textContent = '-';
    metaEl.textContent = '';
  }

  function wireAutoCalculate(root, callback) {
    const inputs = root.querySelectorAll('input, select');
    inputs.forEach(el => {
      el.addEventListener('input', () => schedule(root, callback));
      el.addEventListener('change', () => schedule(root, callback));
    });

    // run once
    schedule(root, callback);
  }

  function schedule(root, callback) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const inputs = readInputs(root);
      if (!inputs) return;
      await callback(inputs);
    }, 300);
  }

  function readInputs(root) {
    const leftValueEl = root.querySelector('[data-qm="leftValue"]');
    const rightValueEl = root.querySelector('[data-qm="rightValue"]');
    const leftUnitEl = root.querySelector('[data-qm="leftUnit"]');
    const rightUnitEl = root.querySelector('[data-qm="rightUnit"]');
    const targetUnitEl = root.querySelector('[data-qm="targetUnit"]');

    if (!leftValueEl || !leftUnitEl) return null;

    const leftValue = Number(leftValueEl.value);
    const leftUnit = leftUnitEl.value;

    const rightValue = rightValueEl ? Number(rightValueEl.value) : 0;
    const rightUnit = rightUnitEl ? rightUnitEl.value : leftUnit;

    const targetUnit = targetUnitEl ? targetUnitEl.value : leftUnit;

    return { leftValue, leftUnit, rightValue, rightUnit, targetUnit };
  }

  function handleQuantityResponse(res) {
    if (!res.ok) {
      state.result = null;

      if (typeof res.data === 'string') {
        state.error = res.data;
      } else if (res.data && res.data.errorMessage) {
        state.error = res.data.errorMessage;
      } else if (res.rawText) {
        state.error = res.rawText;
      } else {
        state.error = `Request failed (${res.status}).`;
      }

      return;
    }

    state.error = null;
    state.result = res.data;
  }

  function toast(message) {
    const t = document.getElementById('toast');
    if (!t) return;

    t.textContent = message;
    t.classList.add('isVisible');

    setTimeout(() => t.classList.remove('isVisible'), 2200);
  }
})();