const en = {
    streamerbotconnected: 'Streamer.bot Online!',
    streamerbotdisconnected: 'Streamer.bot Disconnected!',

    ttschat: 'said',

    chatsendmessage: 'Send Message',

    twitch : {
        firstMessage : () => `First chatter`,
        follow : () => ` followed the channel`,
        announcement : () => ` <div class="reply">📢 <strong>Announcement</strong></div>`,
        channelpoints : ({ title }) => ` <div class="reply"><i class="fa-solid fa-wand-magic-sparkles"></i> <strong>Channel Points - ${title}</strong></div>`,
        bits : ({ bits, message }) => ` cheered <i class="fa-regular fa-gem fall-and-bounce"></i> <strong>${bits} bits</strong>${message ? '<br>'+message : ''}`,

        sub : ({ months, isPrime, tier }) => ` subscribed for
            ${isPrime == true ? '<i class="fa-solid fa-crown"></i>' : '<i class="fa-solid fa-star"></i>'}
            <strong>${months || 1 } ${months == 1 ? 'month' : 'months'}
            (${isPrime == true ? 'Prime' : 'Tier '+tier.toString().charAt(0)})</strong>`,

        resub : ({ months, isPrime, tier, message }) => ` subscribed for
            ${isPrime == true ? '<i class="fa-solid fa-crown"></i>' : '<i class="fa-solid fa-star"></i>'}
            <strong>${months || 1 } ${months == 1 ? 'month' : 'months'}
            (${isPrime == true ? 'Prime' : 'Tier '+tier.toString().charAt(0)})</strong>
            ${message ? '<br>'+message : '' }`,

        gifted : ({ gifted, months, tier }) => ` gifted
            <strong>${months || 1 } ${months == 1 ? 'month' : 'months'}
            of Tier ${tier.toString().charAt(0)} ${months == 1 ? 'sub' : 'subs'}</strong>
            to <i class="fa-solid fa-gift"></i> <strong>${gifted}</strong>`,
        
        giftedbomb : ({ count, total, tier }) => ` gifted <i class="fa-solid fa-gift"></i> <strong>${count} subs (Tier ${tier.toString().charAt(0)})</strong> to the Community, <strong>${total || 1} ${total == 1 ? 'gift' : 'gifts'} in total</strong>`,

        raid : ({ viewers }) => ` raided the channel with <i class="fa-solid fa-users"></i> <strong>${viewers} viewers</strong>`
        
    },


    youtube : {
        superchat : ({ money, message }) => ` superchatted <i class="fa-solid fa-comments-dollar"></i> <strong>${money}</strong>
        ${message ? '<br>'+message : ''}
        `,

        supersticker : ({ money, sticker }) => ` 
        ${sticker ? '<br>': ''}
        sent a supersticker of <i class="fa-solid fa-comments-dollar"></i> <strong>${money}</strong>
        ${sticker ? '</span></span><span class="sticker"><img src="'+sticker+'"></span>': ''}
        `,

        member : ({ months, tier, message }) => ` became a member for
            <i class="fa-solid fa-star"></i>
            <strong>${months || 1 } ${months && months > 1 ? 'months' : 'month'}
            (Tier ${tier})</strong>
            ${message ? '<br>'+message : ''}`,
        
        giftedmembers : ({ total, tier }) => ` gifted <i class="fa-solid fa-gift"></i> <strong>${total} ${total == 1 ? 'membership' : 'memberships'} (Tier ${tier}) to the channel</strong>`,

        giftedtrainmembers : ({ gifted, tier }) => ` gifted a membership
            <strong>(${tier})</strong>
            to <i class="fa-solid fa-gift"></i> <strong>${gifted}</strong>`,
        
    },


    streamlabs : {
        tip : ({ money, message }) => ` donated 🪙 <strong>${money}</strong>${message ? '<br>'+message : ''}`,
    },


    streamelements : {
        tip : ({ money, message }) => ` donated 🪙 <strong>${money}</strong>${message ? '<br>'+message : ''}`,
    },


    tiktok : {
        follow : () => ` followed the channel`,
        likes : (likes) => `sent <strong><i class="fa-solid fa-heart"></i> <em class="likecount" style="font-style: normal;">${likes}</em> likes</strong>`,
        sub : ({ months }) => ` subscribed for <i class="fa-solid fa-star"></i> <strong>${months || 1 } ${(months && months > 1) ? 'months' : 'month'}</strong>`,
        gift : ({ gift, count, coins }) => ` gifted <strong>${gift} x${count}</strong> (🪙 <strong>${coins} ${(coins && coins > 1) ? 'coins' : 'coin'})</strong>`,
        
    },

    kick : {
        follow : () => ` followed the channel`,

        sub : ({ months, tier }) => ` subscribed for
            <strong>${months || 1 } ${months == 1 ? 'month' : 'months'}
            (Tier ${tier})</strong>`,

        gifted : ({ gifted, tier, total }) => ` gifted
            <strong>${total || 1 } ${total == 1 ? 'sub' : 'subs'}
            (Tier ${tier})</strong>
            to <i class="fa-solid fa-gift"></i> <strong>${gifted}</strong>`,
        
        giftedbomb : ({ count, tier }) => ` gifted <i class="fa-solid fa-gift"></i> <strong>${count} subs (Tier ${tier})</strong> to the Community`,

        raid : ({ viewers }) => ` raided the channel with <i class="fa-solid fa-users"></i> <strong>${viewers} viewers</strong>`
        
    },

    patreon: {
        membership: ({ money }) => ` pledged a membership ($${money})`
        
    },

    tipeeestream : {
        tip : ({ money, message }) => ` donated 🪙 <strong>${money}</strong>${message ? '<br>'+message : ''}`,
    },

    kofi : {
        donation : ({ money, message }) => ` donated 🪙 <strong>${money}</strong>${message ? '<br>'+message : ''}`,
        sub : ({ money, tier, message }) => ` subscribed <strong>(${money}) ${tier ? '(Tier '+tier+')' : ''}</strong>${message ? '<br>'+message : ''}`,
        resub : ({ money, tier, message }) => ` resubscribed <strong>${money} ${tier ? '(Tier '+tier+')' : ''}</strong>${message ? '<br>'+message : ''}`,
        order : ({ money, items }) => ` ordered <strong>${items} ${items == 1 ? 'item' : 'items'} (${money == 0 ? 'Free' : money})`,
    },

    fourthwall : {
        someone : () => `Someone`,

        donation : ({ money, message }) => ` donated 🪙 <strong>${money}</strong>${message ? '<br>'+message : ''}`,
        sub : ({ money }) => ` subscribed <strong>(${money})</strong>`,

        order : ({
            money,
            firstItem,
            items,
            message,
            image,
            
        }) => ` 
        ${image ? '<br>': ''}
        ordered <strong>${firstItem}</strong> ${items > 1 ? 'and <strong>'+(items - 1)+' other '+((items - 1) == 1 ? 'item' : 'items')+'</strong>' : ''} 
        (${money == 0 ? 'Free' : money})
        ${message.trim() ? '<br>'+message : ''}
        ${image ? '</span></span><span class="image"><img src="'+image+'"></span>': ''}
        `,

        gift : ({
            money,
            firstItem,
            items,
            message,
            image,
            
        }) => ` 
        ${image ? '<br>': ''}
        gifted <strong>${items}x ${firstItem}</strong>
        (${money == 0 ? 'Free' : money})
        ${message.trim() ? '<br>'+message : ''}
        ${image ? '</span></span><span class="image"><img src="'+image+'"></span>': ''}
        `,


        
        drawstart : ({ gift, command, time }) => ` 
        <strong><i class="fa-solid fa-gift"></i> Giveaway started!</strong> 
        <br>Type <strong>${command}</strong> to have a chance to win <strong>${gift}</strong>. You have <strong>${time} seconds!</strong>`,

        drawend : ({ winners }) => ` 
        <strong>🎉 Giveaway Ended!</strong> 
        <br>Congratulations <strong>${winners}</strong>`,



    },
}