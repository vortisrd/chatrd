/**
 * multi-choice-field.js - THANK YOU CLAUDE! <3
 *
 * multiChoiceField(input, options)
 * Transforma um <input type="text"> em um seletor de tags pré-definidas
 * (estilo WordPress), mantendo o valor sincronizado com o próprio input,
 * então ele viaja normalmente dentro de qualquer <form>.
 *
 * Requer o arquivo multi-choice-field.css para o visual do componente.
 *
 * @param {HTMLInputElement|string} input  Elemento <input> ou seletor CSS
 * @param {Object}   options
 * @param {Array}    options.choices        Lista de opções: [{ value, label, color, desc, group }]
 *                                          `group` (opcional) marca a opção como parte de um
 *                                          grupo exclusivo: ao selecionar uma opção com esse
 *                                          `group`, qualquer outra já selecionada do mesmo
 *                                          grupo é removida automaticamente (comportamento
 *                                          tipo "radio" dentro de um campo de múltipla escolha).
 * @param {string}   [options.placeholder]  Placeholder quando vazio
 * @param {Array}    [options.value]        Valores iniciais já selecionados. Se omitido, o
 *                                          componente usa o que já estiver no atributo/valor
 *                                          do próprio input (ex: value="subscriber,everyone").
 * @param {Function} [options.onChange]     Callback(values) chamado a cada mudança (adição ou remoção)
 * @param {Function} [options.onAdd]        Callback(value, values) chamado quando uma opção é adicionada
 * @param {Function} [options.onRemove]     Callback(value, values) chamado quando uma opção é removida
 *
 * @returns {Object} API da instância: { get, getString, set, clear, destroy }
 */
function multiChoiceField(input, options) {
  const el = typeof input === 'string' ? document.querySelector(input) : input;
  if (!el) throw new Error('multiChoiceField: elemento não encontrado.');
  if (el.dataset.multiChoiceInitialized) {
    console.warn('multiChoiceField: este elemento já foi inicializado.', el);
    return el._multiChoiceApi;
  }

  const choices     = options.choices || [];
  const placeholder = options.placeholder || 'Selecionar...';
  const onChange    = options.onChange || function () {};
  const onAdd       = options.onAdd || function () {};
  const onRemove    = options.onRemove || function () {};

  let selectedValues = (options.value || multiChoiceParseInitialValue(el.value))
    .filter(v => choices.some(c => c.value === v));

  // Lê o valor inicial já presente no input (ex: "subscriber,everyone"),
  // usado como fallback quando options.value não é passado.
  function multiChoiceParseInitialValue(rawValue) {
    return (rawValue || '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  }

  // ---- Monta a estrutura visual, escondendo o input original ----
  const multiChoiceWrapper = document.createElement('div');
  multiChoiceWrapper.className = 'mchoice-wrapper';

  const multiChoiceBox = document.createElement('div');
  multiChoiceBox.className = 'mchoice-box';

  const multiChoiceVisibleInput = document.createElement('input');
  multiChoiceVisibleInput.type = 'text';
  multiChoiceVisibleInput.className = 'mchoice-input';
  multiChoiceVisibleInput.autocomplete = 'off';
  multiChoiceVisibleInput.readOnly = true;
  multiChoiceVisibleInput.placeholder = placeholder;

  const multiChoiceDropdown = document.createElement('div');
  multiChoiceDropdown.className = 'mchoice-dropdown';

  multiChoiceBox.appendChild(multiChoiceVisibleInput);
  multiChoiceWrapper.appendChild(multiChoiceBox);
  multiChoiceWrapper.appendChild(multiChoiceDropdown);

  // input original vira o "valor real" enviado no form: escondido via CSS
  // (mantendo type="text"), mas continua tendo o mesmo name/id, então
  // FormData e name= continuam funcionando.
  el.style.display = 'none';
  el.dataset.multiChoiceInitialized = 'true';
  el.parentNode.insertBefore(multiChoiceWrapper, el);
  multiChoiceWrapper.appendChild(el);

  // ---- Renderização ----
  function multiChoiceRenderTags() {
    multiChoiceBox.querySelectorAll('.mchoice-tag').forEach(t => t.remove());

    selectedValues.forEach(value => {
      const opt = choices.find(o => o.value === value);
      if (!opt) return;

      const tagEl = document.createElement('span');
      tagEl.className = 'mchoice-tag';
      tagEl.innerHTML = `
        ${opt.label}
        <button type="button" aria-label="Remover ${opt.label}" data-value="${opt.value}">
          <svg viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      `;
      multiChoiceBox.insertBefore(tagEl, multiChoiceVisibleInput);
    });

    multiChoiceVisibleInput.placeholder = selectedValues.length ? '' : placeholder;
    multiChoiceRenderDropdown();
    multiChoiceSyncValue();
  }

  function multiChoiceRenderDropdown() {
    const remainingChoices = choices.filter(o => !selectedValues.includes(o.value));

    if (remainingChoices.length === 0) {
      multiChoiceDropdown.innerHTML = `<div class="mchoice-empty">Todas as opções já foram adicionadas.</div>`;
      return;
    }

    multiChoiceDropdown.innerHTML = remainingChoices.map(o => `
      <div class="mchoice-option" data-value="${o.value}">
        ${o.color ? `<span class="mchoice-dot" style="background:${o.color}"></span>` : ''}
        ${o.label}
        ${o.desc ? `<span class="mchoice-desc">${o.desc}</span>` : ''}
      </div>
    `).join('');
  }

  function multiChoiceSyncValue() {
    el.value = selectedValues.join(',');
    onChange(multiChoiceGetValues());
  }

  function multiChoiceGetValues() { return [...selectedValues]; }

  // ---- Abrir / fechar dropdown ----
  function multiChoiceOpenDropdown() {
    multiChoiceBox.classList.add('is-expanded');
    multiChoiceDropdown.classList.add('is-shown');
  }
  function multiChoiceCloseDropdown() {
    multiChoiceBox.classList.remove('is-expanded');
    multiChoiceDropdown.classList.remove('is-shown');
  }

  function multiChoiceHandleOutsideClick(e) {
    if (!multiChoiceWrapper.contains(e.target)) multiChoiceCloseDropdown();
  }

  multiChoiceBox.addEventListener('click', () => {
    multiChoiceOpenDropdown();
    multiChoiceVisibleInput.focus();
  });

  multiChoiceDropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.mchoice-option');
    if (!item) return;
    const value = item.dataset.value;
    if (selectedValues.includes(value)) return;

    const chosenOption = choices.find(o => o.value === value);

    // Se a opção pertence a um grupo exclusivo, remove qualquer outro
    // valor já selecionado do mesmo grupo antes de adicionar o novo.
    if (chosenOption && chosenOption.group) {
      const groupValues = choices
        .filter(o => o.group === chosenOption.group)
        .map(o => o.value);

      const replacedValues = selectedValues.filter(v => groupValues.includes(v));
      selectedValues = selectedValues.filter(v => !groupValues.includes(v));
      replacedValues.forEach(v => onRemove(v, multiChoiceGetValues()));
    }

    selectedValues.push(value);
    multiChoiceRenderTags();
    onAdd(value, multiChoiceGetValues());
  });

  multiChoiceBox.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.mchoice-tag button');
    if (!removeBtn) return;
    e.stopPropagation();
    const removedValue = removeBtn.dataset.value;
    selectedValues = selectedValues.filter(v => v !== removedValue);
    multiChoiceRenderTags();
    onRemove(removedValue, multiChoiceGetValues());
  });

  multiChoiceVisibleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && selectedValues.length) {
      const removedValue = selectedValues.pop();
      multiChoiceRenderTags();
      onRemove(removedValue, multiChoiceGetValues());
    }
  });

  document.addEventListener('click', multiChoiceHandleOutsideClick);

  // ---- API pública desta instância ----
  const multiChoiceApi = {
    get: multiChoiceGetValues,
    getString: () => selectedValues.join(','),
    set: (values) => {
      selectedValues = values.filter(v => choices.some(c => c.value === v));
      multiChoiceRenderTags();
    },
    clear: () => { selectedValues = []; multiChoiceRenderTags(); },
    destroy: () => {
      document.removeEventListener('click', multiChoiceHandleOutsideClick);
      multiChoiceWrapper.replaceWith(el);
      el.style.display = '';
      delete el.dataset.multiChoiceInitialized;
    }
  };

  el._multiChoiceApi = multiChoiceApi;
  multiChoiceRenderTags();
  return multiChoiceApi;
}