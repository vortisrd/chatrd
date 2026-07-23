# ![ChatRD](https://i.imgur.com/Ifpd7Ay.png)

ChatRD is a chat tool and/or overlay widget that unifies messages and events from **Twitch**, **YouTube**, **TikTok**, **Kick**, **Streamlabs**, **StreamElements**, **Patreon**, **TipeeeStream**, **Ko-Fi** and **Fourthwall**.

![ChatRD Config UI](https://i.imgur.com/cKWHE03.png)

## 🛠️ Setting it up

### Video Tutorial (Portuguese and English)
[![Watch the video](https://i.imgur.com/zWWfR9r.jpeg)](https://www.youtube.com/watch?v=k90wNUquO_w)

### Detailed tutorial
First, download **[Streamer.bot](https://streamer.bot/)** for **Twitch**, **YouTube** and **Kick** support and the **[TikFinity Desktop App](https://tikfinity.zerody.one/app/)** for TikTok (partial) support. Make sure your **Twitch**, **YouTube** and **Kick** accounts are connected on **Streamer.bot**. Also have **TikFinity Desktop App** installed and your account on **TikTok** setup. **BOTH APPS NEED TO RUN ON THE SAME PC**.

If you have both of these ready, follow these steps:

1. On **Streamer.bot**, import the file [chatrd.sb](https://github.com/vortisrd/chatrd/blob/main/chatrd.sb) to your **Streamer.bot**.
2. Go to **Server/Clients → WebSocket Server** and make sure it is running.
5. Open the [Settings Page](https://vortisrd.github.io/chatrd) in your browser.
6. Choose your desired options.
7. Click **"Copy URL"**.
8. Add the copied URL as a Browser Source in OBS. Or use it in your browser to read chat. 😊
9. For **Streamlabs**, **StreamElements**, **Patreon**, **TipeeeStream**, **Ko-Fi** and **Fourthwall**, you need to connect them to your Streamer.Bot account to their website. Follow the tutorial links in each section presented in the [Settings Page](https://vortisrd.github.io/chatrd).

---

## 🔊 Setting TTS with Speaker.Bot

1. Go to **Settings → WebSocket Server**, click on *Start Server*. Make sure to also tick the *Auto-Start* checkbox.
2. Copy the IP and Port to ChatRD Speaker.bot fields.
3. Go  to **Settings → Speech Engine** and add the TTS Service of your preference. (Sapi5 is the Windows default).
4. Go to **Settings → Voice Aliases**, give it a name and click **Add** right next to it.
5. In the Left Column, click on the **SpeakerBot** you just added and on the **Speak!** section, select the voice you want to use and click **Add**. (If you're using Sapi5, I recommend using *Microsoft Zira Desktop* as a voice).
6. Add the Alias name under the *Voice Alias* field on ChatRD.

---

## 💬 Sending Messages to TikTok
To send messages to **TikTok** using the *Chat Field*, you need to the following on **TikFinity**:

1. Make sure you're connected to your TikTok Account on **TikFinity**. If you're not, go to **Setup → TikTok Login** and click on *Login to TikTok*.
2. Go to **Setup → Streamer.Bot Connection** and type the IP and the PORT you're using on your **Streamer.Bot** and then click on *Test Connection*.

![TikFinity Setup → Streamer.Bot Connection](https://i.imgur.com/h0QDnNX.png)

3. Go to **Chatbot → Streamer.Bot Messages** and enable *Allow Streamer.Bot to push messages to TikFinity*. 

![Chatbot → Streamer.Bot Messages](https://i.imgur.com/IGQ5xQq.png)

---

## 💻 Commands supported by the Chat Field

**Commands for Twitch**
- /me (message)
- /clip
- /announce (message)
- /announceblue (message)
- /announcegreen (message)
- /announceorange (message)
- /announcepurple (message)
- /clear
- /slow (duration in seconds)
- /slowoff
- /emoteonly
- /emoteonlyoff
- /subscribers
- /subscribersoff
- /commercial (duration in seconds)
- /timeout (user) (duration) (reason)
- /untimeout (user)
- /ban (user) (reason)
- /unban (user)
- /mod (user)
- /unmod (user)
- /vip (user)
- /unvip (user)
- /shoutout (user)
- /raid (user)
- /unraid
- /settitle (stream title)
- /setgame (game name)

**Commands for YouTube**
- /yt/title (stream title)
- /yt/timeout (userID) (duration in seconds)
- /yt/ban (userID)

**Commands for Kick**
- /kick/title (stream title)
- /kick/category (stream category title)
- /kick/timeout (user) (duration in seconds)
- /kick/untimeout (user)
- /kick/ban (user) (reason)
- /kick/unban (user)

**TikTok**
- TikTok commands are not supported.


---

## ❓ Frequently Asked Questions
**- Can I use it to read my chat?**
R: Yes you can. You can open it on your browser, use it as a chat overlay and/or use it as a dock in OBS.

**- What about YouTube Members Emotes?**
R: YouTube doesn't expose their Membership/Partner Emojis to Streamer.bot. You would have to add them manually on ChatRD's Members Only Emotes section.

What Casterlabs Caffeinated, Social Stream Ninja and Onecomme do to scrape the emotes won't work with the current way Streamer.Bot and my code works, so I had to choose between **making the user add them manually** or build a **server-sided executable (using NodeJS, Python or whatever) to read the chat as it's going or scrape the HTML code**. I don't want to add another executable on top of the user's flow, so it would be easier to use what it's currently available. **And no, I won't do any research based on what other tools do.**

**- Can I set TTS to read only the events I want to read?**
R: No. ChatRD sends either chats, events or both to Speaker.bot.

**- TikTok events are not working anymore, what should I do?**
R: Make sure your TikFinity is connected to your account and you are live.

**- My Twitch views are not updating. What's happening?**
R: Streamer.bot does that from time to time. It doesn't relay the view count update. Close Streamer.bot and open it again.

**- Kick events are not working or are taking too much time to show, what should I do?**
R: Kick's API is notoriously slow on their peak usage. It's been reported on [Streamer.bot](https://discord.streamer.bot/) Discord (check the #html-css-js section) that sometimes it could take up to 60 seconds for the responses to be relayed. I hope in the future they throw more money into their servers.

**- Can you add other streaming/payment platforms?**
R: ChatRD uses Streamer.Bot to 95% of all platform iterations. *TikFinity* is perfectly integrated via WebSockets. So if the platform has any integration with Streamer.bot or has a decent WebSocket API (not WebHooks), feel free to suggest it. Other than that, there are no plans to add more platforms.

**- Can I customize it?**
R: If you mean visual styles, you can add your own using the *Custom CSS* field in OBS's Browser Source Properties Window. You can use your browser Dev Tools to inspect the elements you want to change. **I won't provide support if you're planning to customize codes that could break ChatRD**.

**- I forked/downloaded ChatRD to change it to my liking, both on CSS and Javascript. Can you provide support in this situation?**
R: I assume you know what you're doing if you forked/downloaded ChatRD to customize it. That being said, **no, I won't.**.

---

## ✨ Credits

Made with ❤️ by **VortisRD**  

🔗 [GitHub](https://github.com/vortisrd) • [Twitch](https://twitch.tv/vortisrd) • [YouTube](https://youtube.com/@vortisrd) • [Kick](https://kick.com/vortisrd) • [TikTok](https://tiktok.com/@vortisrd) • [Twitter / X](https://twitter.com/vortisrd)  

Heavily inspired by [Nutty](https://nutty.gg). *Seriously, go give him some money!*

🔗 [GitHub](https://github.com/nuttylmao) • [Twitch](https://twitch.tv/nutty) • [YouTube](https://youtube.com/@nuttylmao) • [Kick](https://kick.com/nutty) • [TikTok](https://tiktok.com/@nuttylmao) • [Twitter / X](https://x.com/nuttylmao)