const showStreamlabsDonations       = getURLParam("showStreamlabsDonations", true);

const streamLabsHandlers = {
    'Streamlabs.Donation': (response) => {
        console.debug('StreamLabs Event', response.data);
        streamLabsEventMessage(response.data);
    },
};
for (const [event, handler] of Object.entries(streamLabsHandlers)) {
    streamerBotClient.on(event, handler);
}

async function streamLabsEventMessage(data) {
    
    if (showStreamlabsDonations == false) return;
    
    const {
        from: userName,
        formattedAmount: moneyFromUser,
        currency: currencyFromUser,
        message: messageFromUser,
    } = data;
    
    const userID = createRandomString(40);
    const messageID = createRandomString(40);
    const [avatar, message] = await Promise.all([
        '',
        currentLang.streamlabs.tip({
            money : formatCurrency(moneyFromUser,currencyFromUser),
            message : messageFromUser
        })
    ]);
    const classes = '';
    const messageData = {
        classes: classes,
        avatar,
        badges: '',
        userName,
        color: '#FFF',
        message,
        reply: '',
    };
    addEventToChat(userID, messageID, 'streamlabs', messageData);
}