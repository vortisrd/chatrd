## General
- **Random Color Generator** now generates fewer darker colors.
- **"Same as Twitch Chat"** orientation scroll glitch fixed.
- **Global Settings was split.** The visual customizations are now called **"Visual Styles"** and it's a separate tab.
- **Sound Settings function updated.** Now, if the "Group Every" is set to 0 ou 1, it will play the sound notification immediately. If it's set higher, it won't play unless the amount of messages is equal or higher than what was set. If it doesn't reach that number, it will wait for the amount of seconds set over "Silence Interval" and play the sound if no messages arrive. If it does, it will resume the count.

## YouTube
- Fixed a visual glitch where MODS didn't have their user names blue and paid members didn't have their name green.

## TikTok
- **Added New Emojis from a Static List**. I know some of you have seen things like *[laughcry]* or *[rockyloveit]* in your chat. Those are emotes from TikTok itself and the the scrapers around don't send these urls on their payload. So, I took upon myself to create a static list of those emojis to put in chat.
- **EulerStream service option arrived**.
    - You will need to create an account over [Eulerstream](https://www.eulerstream.com/) and create an API key there.
    - Both user and API Key are saved within Streamer.bot. It's not public exposed over the URL.
    - It usually takes 2 minutes for the code to know that you're live.
    - Each connection burns one free session token. So as soon as it connects, don't change your username over settings.
    - Changes would only take effect after you click "Save Service Information", regardless if ChatRD preview reloaded or not.

This setting is **EXPERIMENTAL!** There are still a lot of things we can't control. **ALSO, PLEASE, IF YOU CHANGE THE SERVICE, THE USERNAME OR THE API KEY, PRESS THE "SAVE SERVICE INFORMATION" BUTTON.** I've added visual cues for you to do it, but I'm just claryfing it myself here. :)

## Known Bugs
### TikTok
- EulerStream sometimes misses chat messages and events. So don't be surprised if some chat or event message doesn't appear over ChatRD.