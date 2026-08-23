/* ---------------------------- */
/* STREAMLABS MODULE VARIABLES */
/* ---------------------------- */

const showStreamlabs                = getURLParam("showStreamlabs", false);
const showStreamlabsDonations       = getURLParam("showStreamlabsDonations", true);

const streamlabsHandlers = {
    'Streamlabs.Donation' : (response) => {
        streamLabsEventMessage(response.data);
    },
};


if (showStreamlabs) {
    registerPlatformHandlersToStreamerBot(streamlabsHandlers, '[ChatRD][Streamlabs]');
}



async function streamLabsEventMessage(data) {

    if (showStreamlabsDonations == false) return;

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

    const classes = ['streamlabs', 'donation'];

    header.remove();

    
    var money = formatCurrency(data.amount,data.currency);

    user.innerHTML = `<strong>${data.from}</strong>`;

    // Aplicação da tradução baseada no en.json
    action.innerHTML = tRD('streamlabs.donated_action');

    value.innerHTML = `<strong>${money}</strong>`;
    
    if (data.message) { message.innerHTML = `${data.message}`; }
    else { message.remove(); }
    

    addEventItem('streamlabs', clone, classes, userId, messageId);
}