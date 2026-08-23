/* ------------------------- */
/* PATREON MODULE VARIABLES */
/* ------------------------- */

const showPatreon                   = getURLParam("showPatreon", false);
const showPatreonMemberships        = getURLParam("showPatreonMemberships", true);

// PATREON EVENTS HANDLERS

const patreonHandlers = {
    'Patreon.PledgeCreated': (response) => {
        patreonMemberships(response.data);
    },
};

if (showPatreon) {
    registerPlatformHandlersToStreamerBot(patreonHandlers, '[ChatRD][Patreon]');
}



// PATREON EVENTS FUNCTIONS

async function patreonMemberships(data) {

    if (showPatreonMemberships == false) return;

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

    const classes = ['patreon', 'membership'];

    header.remove();

    
    var money = (data.attributes.will_pay_amount_cents / 100).toFixed(2);

    user.innerHTML = `<strong>${data.attributes.full_name}</strong>`;
    
    // Aplicação da tradução aqui
    action.innerHTML = tRD('patreon.donated_action');
    
    value.innerHTML = `<strong>($${money})</strong>`;

    message.remove();

    addEventItem('patreon', clone, classes, userId, messageId);
}