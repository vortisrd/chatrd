## General
- **Random Color Generator** now generates fewer darker colors on YouTube and TikTok user names.
- **Global Settings was split.** The visual customizations are now called **"Visual Styles"** and it's a separate tab.
- **"Same as Twitch Chat"** orientation scroll glitch fixed. (thank you @quickie101 for reporting this)
- **Sound Settings function updated.** Now, if the "Group Every" is set to 0 ou 1, it will play the sound notification immediately. If it's set higher, it won't play unless the amount of messages is equal or higher than what was set. If it doesn't reach that number, it will wait for the amount of seconds set over "Silence Interval" and play the sound if no messages arrive. If it does, it will resume the count. (thank you @ggdebon for reporting this)

## YouTube
- Fixed a visual glitch where MODS didn't have their user names blue and paid members didn't have their name green.

## TikTok
- **Added New Emojis from a Static List**. I know some of you have seen things like *[laughcry]* or *[rockyloveit]* in your chat. Those are emotes from TikTok itself and the the scrapers around don't send these urls on their payload. So, I took upon myself to create a static list of those emojis to put in chat.
- **About the Eulerstream Support**.
Tonight I did a 3 hour stream using Eulerstream to connect to TikTok and, I have to say, **it was terrible**. It disconnected several times and when it came back, all 5 to 10 events and messages previous to the disconnection played out again. It seems when chat is idle, it does that from time to time. Most of the connection/reconnection logic was being done behind the scenes using Streamer.bot and it took some effort to get that running so after a long time watching events using Eulerstream, I was confident that I could use it myself. Huge mistake :(

Eulerstream's website has very, **VERY** poorly written documentation, if any. The majority of the events are not there at all and if you find them anywhere, it could be wrong, making us devs having to connect to any stream in hopes of finding a decent payload. It's the opposite of Tik.Tools, that was a great documentation but the payload sometimes is not even decoded properly and sometimes it's incomplete or glitched.

After the facts mentioned above and since I'm not proficient with C#, **I've decided to stop the search for TikFinity options.** I have to say, despite it's flaws, TikFinity still is the best option for TikTok users out there in my opinion. I know some of you were waiting and I'm really sorry to let you guys down.