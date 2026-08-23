/* --------------------- */
/* KOFI MODULE VARIABLES */
/* --------------------- */

const showKofi                          = getURLParam("showKofi", false);
const showKofiSubscriptions             = getURLParam("showKofiSubscriptions", true);
const showKofiDonations                 = getURLParam("showKofiDonations", true);
const showKofiOrders                    = getURLParam("showKofiOrders", true);


// KOFI EVENTS HANDLERS

const kofiMessageHandlers = {
    'Kofi.Donation': (response) => {
        kofiDonationMessage(response.data);
    },
    'Kofi.Subscription': (response) => {
        kofiSubMessage(response.data);
    },
    'Kofi.Resubscription': (response) => {
        kofiReSubMessage(response.data);
    },
    'Kofi.ShopOrder': (response) => {
        kofiOrderMessage(response.data);
    },
};

if (showKofi) {
    registerPlatformHandlersToStreamerBot(kofiMessageHandlers, '[ChatRD][Ko-Fi]');
}



// KOFI EVENT FUNCTIONS

async function kofiDonationMessage(data) {

    if (showKofiDonations == false) return; // Corrigido de kofiDonationMessage para a variável correta

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = createRandomString(40);

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kofi', 'donation'];

    header.remove();

    
    user.innerHTML = `<strong>${data.from}</strong>`;
    action.innerHTML = tRD('kofi.donated_action'); //

    var money = formatCurrency(data.amount,data.currency);
    value.innerHTML = `<strong>${money}</strong>`;

    if (data.message) message.innerHTML = `${data.message}`;

    addEventItem('kofi', clone, classes, userId, messageId);
}



async function kofiSubMessage(data) {

    if (showKofiSubscriptions == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = createRandomString(40);

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kofi', 'sub'];

    header.remove();

    
    user.innerHTML = `<strong>${data.from}</strong>`;
    action.innerHTML = tRD('kofi.sub_action'); //

    var money = formatCurrency(data.amount,data.currency);
    value.innerHTML = `<strong>(${money})</strong>`;

    if (data.message) message.innerHTML = `${data.message}`;

    addEventItem('kofi', clone, classes, userId, messageId);
}



async function kofiReSubMessage(data) {

    if (showKofiSubscriptions == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = createRandomString(40);

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kofi', 'sub'];

    header.remove();

    
    user.innerHTML = `<strong>${data.from}</strong>`;
    action.innerHTML = tRD('kofi.resub_action'); //

    var money = formatCurrency(data.amount,data.currency);
    value.innerHTML = `<strong>(${money}) ${data.tier ? '(Tier '+data.tier+')' : ''}</strong>`;

    if (data.message) message.innerHTML = `${data.message}`;

    addEventItem('kofi', clone, classes, userId, messageId);
}



async function kofiOrderMessage(data) {

    if (showKofiOrders == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = createRandomString(40);

    const {
        header,
        platform,
        user,
        action,
        value,
        'actual-message': message
    } = Object.fromEntries(
        [...clone.querySelectorAll('[class]')]
            .map(el => [el.className, el])
    );

    const classes = ['kofi', 'sub'];

    header.remove();

    
    user.innerHTML = `<strong>${data.from}</strong>`;
    action.innerHTML = tRD('kofi.order_action'); //
    
    var money = '';
    if (data.amount == 0) money = tRD('kofi.free'); //
    else money = formatCurrency(data.amount,data.currency);
    
    // Lógica para singular/plural de itens
    const itemLabel = data.items.length > 1 ? tRD('kofi.order_plural') : tRD('kofi.order_singular'); //
    
    value.innerHTML = `<strong>${data.items.length} ${itemLabel} (${money})</strong>`;

    if (data.message) message.innerHTML = `${data.message}`;

    addEventItem('kofi', clone, classes, userId, messageId);
}