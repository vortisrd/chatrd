/* --------------------------- */
/* FOURTHWALL MODULE VARIABLES */
/* --------------------------- */

const showFourthwall                    = getURLParam("showFourthwall", false);

const showFourthwallDonations           = getURLParam("showFourthwallDonations", true);
const showFourthwallSubscriptions       = getURLParam("showFourthwallSubscriptions", true);

const showFourthwallOrders              = getURLParam("showFourthwallOrders", true);
const showFourthwallShowImage           = getURLParam("showFourthwallShowImage", true);

const showFourthwallGiftPurchase        = getURLParam("showFourthwallGiftPurchase", true);
const showFourthwallShowGiftImage       = getURLParam("showFourthwallShowGiftImage", true);

const showFourthwallGiftDraw            = getURLParam("showFourthwallGiftDraw", true);
const fourthWallGiftDrawCommand         = getURLParam("fourthWallGiftDrawCommand", "!enter");


// FOURTHWALL EVENTS HANDLERS

const fourthwallMessageHandlers = {
    'Fourthwall.Donation': (response) => {
        fourthwallDonationMessage(response.data);
    },
    'Fourthwall.SubscriptionPurchased': (response) => {
        fourthwallSubMessage(response.data);
    },
    'Fourthwall.OrderPlaced': (response) => {
        fourthwallOrderMessage(response.data);
    },
    'Fourthwall.GiftPurchase': (response) => {
        fourthwallGiftMessage(response.data);
    },
    'Fourthwall.GiftDrawStarted': (response) => {
        fourthwallGiftDrawStartMessage(response.data);
    },
    'Fourthwall.GiftDrawEnded': (response) => {
        fourthwallGiftDrawEndMessage(response.data);
    },
};

if (showFourthwall) {
    registerPlatformHandlersToStreamerBot(fourthwallMessageHandlers, '[Fourthwall]');
}



// FOURTHWALL EVENT FUNCTIONS

async function fourthwallDonationMessage(data) {

    if (showFourthwallDonations == false) return;

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

    const classes = ['fourthwall', 'donation'];

    header.remove();

    
    user.innerHTML = `<strong>${data.username}</strong>`;
    action.innerHTML = tRD('fourthwall.donated_action');

    var money = formatCurrency(data.amount,data.currency);
    value.innerHTML = `<strong>${money}</strong>`;

    if (data.message) message.innerHTML = `${data.message}`;

    addEventItem('fourthwall', clone, classes, userId, messageId);
}



async function fourthwallOrderMessage(data) {

    if (showFourthwallOrders == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = createRandomString(40);

    const username = data.username;
	const total = data.total;
	const currency = data.currency;
	const item = data.variants[0].name;
	const itemsQuantity = data.variants.length;
	const text = stripStringFromHtml(data.statmessageus);
    const imageUrl = data?.variants?.[0]?.image ?? '';

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

    const classes = ['fourthwall', 'order'];

    if (showFourthwallShowImage == true) {
        if (imageUrl) { header.innerHTML = `<img src="${imageUrl}">`; }
        else { header.remove(); }
    }
    else { header.remove(); }

    
    var userName = '';
    if (username == undefined) { userName = tRD('fourthwall.someone'); }
    else { userName = username; }

    user.innerHTML = `<strong>${userName}</strong>`;
    action.innerHTML = tRD('fourthwall.ordered_action');

    var money = formatCurrency(total,currency);
    var html = `<strong>${item}</strong>`;

    if (itemsQuantity > 1) { html += ` ${tRD('fourthwall.winners_and')} <strong>${itemsQuantity - 1} ${tRD((itemsQuantity - 1) == 1 ? 'fourthwall.order_singular' : 'fourthwall.order_plural')}</strong> (${total == 0 ? tRD('fourthwall.free') : money})`; }
    else { html += ` (${total == 0 ? tRD('fourthwall.free') : money})`; }

    value.innerHTML = html;

    if (text) message.innerHTML = `${text}`;

    addEventItem('fourthwall', clone, classes, userId, messageId);
}



async function fourthwallGiftMessage(data) {

    if (showFourthwallGiftPurchase == false) return;

    const template = eventTemplate;
	const clone = template.content.cloneNode(true);
    const messageId = createRandomString(40);
    const userId = createRandomString(40);

    const username = data.username;
	const total = data.total;
	const currency = data.currency;
	const item = data.offer.name;
	const itemsQuantity = data.gifts.length;
	const text = stripStringFromHtml(data.statmessageus);
    const imageUrl = data?.offer?.imageUrl ?? '';

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

    const classes = ['fourthwall', 'gift'];

    if (showFourthwallShowGiftImage == true) {
        if (imageUrl) { header.innerHTML = `<img src="${imageUrl}">`; }
        else { header.remove(); }
    }
    else { header.remove(); }

    
    user.innerHTML = `<strong>${userName}</strong>`;
    action.innerHTML = tRD('fourthwall.gifted_action');

    var money = formatCurrency(total,currency);
    var html = `<strong>${itemsQuantity} ${item}</strong>`;
    html += ` (${total == 0 ? tRD('fourthwall.free') : money})`;

    value.innerHTML = html;

    if (text) message.innerHTML = `${text}`;

    addEventItem('fourthwall', clone, classes, userId, messageId);
}



async function fourthwallGiftDrawStartMessage(data) {

    if (showFourthwallGiftDraw == false) return;

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

    const classes = ['fourthwall', 'giftdraw'];

    header.remove();

    
    user.innerHTML = `<strong><i class="fa-solid fa-gifts"></i> ${tRD('fourthwall.giftdraw_user')}</strong>`;
    action.innerHTML = tRD('fourthwall.giftdraw_action', { command: `<strong>${fourthWallGiftDrawCommand}</strong>` });
    value.innerHTML = `<strong>${data.offer.name}</strong>. `
    message.innerHTML = tRD('fourthwall.giftdraw_message', { seconds: `<strong>${durationSeconds}</strong>` });

    addEventItem('fourthwall', clone, classes, userId, messageId);
}



async function fourthwallGiftDrawEndMessage(data) {

    if (showFourthwallGiftDraw == false) return;

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

    const classes = ['fourthwall', 'giftdrawend'];

    header.remove();

    
    user.innerHTML = `<strong>${tRD('fourthwall.giftdrawend_user')}</strong>`;
    action.innerHTML = tRD('fourthwall.giftdrawend_action');
    value.remove();

    var winners = await getWinnersList(data.gifts);

    message.innerHTML = `${winners}`;

    addEventItem('fourthwall', clone, classes, userId, messageId);
}

async function getWinnersList(gifts) {
	const winners = gifts.map(gift => gift.winner).filter(Boolean); // Remove null/undefined

	const numWinners = winners.length;

	if (numWinners === 0) { return ""; }
	if (numWinners === 1) { return winners[0]; }
	if (numWinners === 2) { return `${winners[0]} ${tRD('fourthwall.winners_and')} ${winners[1]}`; }

	// For 3 or more, use the Oxford comma style: A, B, and C
	const allButLast = winners.slice(0, -1).join(", ");
	const lastWinner = winners[winners.length - 1];
	return `${allButLast}${tRD('fourthwall.winners_oxford')} ${lastWinner}`;
}