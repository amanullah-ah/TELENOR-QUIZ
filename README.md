# Telenor Quiz Answers: Telegram Bot + Firebase

Aap Telegram bot ko jawab bhejte hain, bot Firebase mein save karta hai, aur website (`/api/answers`) wahan se khud dikhati hai.

## Setup (ek baar)

### 1. Firebase
1. console.firebase.google.com par project banayein.
2. Build > Firestore Database > Create database (production mode).
3. Rules tab mein `firestore.rules` ka content paste karke Publish karein.
4. Project settings > Service accounts > **Generate new private key**. JSON file download hogi.

### 2. Telegram bot
1. @BotFather > `/newbot` > naam do. **Token** copy karein.

### 3. GitHub + Vercel
1. Ye poora folder GitHub repo mein push karein, phir Vercel mein import karein.
2. Vercel > Settings > Environment Variables mein ye daalein:

| Name | Value |
|---|---|
| FIREBASE_PROJECT_ID | JSON ka `project_id` |
| FIREBASE_CLIENT_EMAIL | JSON ka `client_email` |
| FIREBASE_PRIVATE_KEY | JSON ka `private_key` (poora, `\n` ke saath) |
| TELEGRAM_BOT_TOKEN | BotFather wala token |
| WEBHOOK_SECRET | koi bhi random text (sirf A-Z a-z 0-9 _ -) |
| ADMIN_IDS | aap ka Telegram ID (neeche step 5) |
| SITE_URL | aap ki website ka link (optional) |
| ANTHROPIC_API_KEY | console.anthropic.com se key (sirf screenshot wale tareeqe ke liye) |
| ANTHROPIC_MODEL | optional, default `claude-haiku-5-5` |

3. Deploy karein.

### 4. Webhook jodein
Browser mein ye link kholein (apni cheezein daal kar):

`https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<APNI-SITE>/api/telegram&secret_token=<WEBHOOK_SECRET>`

`"ok":true` aana chahiye.

### 5. Apna ID
Bot ko `/id` bhejein. Jo number aaye wo `ADMIN_IDS` mein daal kar Vercel mein **Redeploy** karein. Kai admin hon to comma se alag karein.

## Roz ka kaam (3 tareeqe, jo pasand ho)

**1. Step by step (free, buttons)**
`/new` bhejein. Phir har sawal ke liye ek message: pehli line sawal, neeche 4 options. Bot A B C D ke buttons dikhata hai, sahi wala dabayen. 5 sawal ke baad khud save.

**2. Screenshot (API key chahiye)**
Quiz ka screenshot bhejein (aik ya kai sawal wala). Bot AI se parhta hai, phir aap sahi jawab ka button dabate hain. Agar screenshot mein sahi option highlight ho to wo khud bhar leta hai.

**3. Poora ek message (aap ka format)**
Sab 5 sawal ek saath paste karein, aakhir mein SHORT ANSWERS:
```
1. Which planet is known as the Red Planet?

A) Earth
B) Mars
C) Venus
D) Jupiter

2. How many days are there in a leap year?
...
5. Which gas do humans need to breathe to survive?

A) Carbon dioxide
B) Oxygen
C) Nitrogen
D) Hydrogen

SHORT ANSWERS: B, C, D, A, B
```
- Bot khud sawal, options aur jawab alag karke save kar deta hai. `/answers` likhna zaroori nahi.
- Date ya reward badalna ho to sab se upar ek line likhein: `2026-11-25 150MB`
- SHORT ANSWERS line na ho to bot A, B, C, D ke buttons se sahi jawab poochta hai.
- Purana `Sawal | A | B | C | D | C` wala format bhi chalta hai.

Date na likhein to aaj ki (Pakistan time). Doosre din ke liye: `/new 2026-11-24 120MB`.
Dono tareeqe mix ho sakte hain (jaise 2 screenshot se, baaki text se).

Extra: `/undo` aakhri sawal hataye, `/cancel` draft khatam, `/today`, `/list`, `/delete 2026-11-24`, `/help`.
Dubara save karne se usi din ka data replace hota hai.

## Files ka structure
- `lib/template.html` = HTML (page ka dhancha)
- `aman.css` = poora design
- `aman.js` = poora logic (language, theme, jawab dikhana, install bar, animations)
- Design ya text badalna ho to sirf `aman.css` / `aman.js` kholen. Badalne ke baad `sw.js` mein `const V = 'tq-v2'` ka number barha dein (`tq-v3`), taake purane users ko nayi file mile.

## Icons
Logo se banay gaye: `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `og-image.png` (share image).
`apk-icons/` folder mein Android APK ke launcher icons (mipmap-mdpi se xxxhdpi), adaptive foreground (432px) aur Play Store icon (512px) hain.

## Website, SEO aur PWA (khud ban jata hai)
- Main page `api/index.js` banata hai (template: `lib/template.html`). Har baar aaj ka data aur sahi domain (canonical, Open Graph, Twitter card, JSON-LD) khud lag jata hai. Alag se kuch badalna nahi.
- `/sitemap.xml` aur `/robots.txt` bhi khud bante hain, domain aur aakhri date ke saath.
- **Installable app:** `manifest.webmanifest`, `sw.js` aur icons maujood hain. Android/Chrome par "Install" ka bar khud aata hai, iPhone par Share > Add to Home Screen ka hint. Internet na ho to aakhri dekha hua data dikhta hai.
- Page khuli rahe to bhi naya data khud aa jata hai (tab wapas kholne par, har 5 minute, aur raat 12 ke baad).
- Website ka domain `lib/site.js` mein `https://telenor-quizanswer.vercel.app` set hai. Custom domain lagayen to Vercel mein `SITE_URL` (jaise `https://mysite.com`) daal dein.
- Google ke liye: deploy ke baad search.google.com/search-console mein site add karke `https://<APNI-SITE>/sitemap.xml` submit karein.
- Pehla data bhejne tak page par purana namoona dikhta hai.

## Note
`index.html` mein purana sample (`DAYS`) sirf backup ke taur par hai, jab tak server se data na aaye. Data aate hi wo hat jata hai.

## Android APK (Install APK button)
- Button aur popup hamesha dikhte hain (iPhone aur installed app ke ilawa). Agar root mein `telenor-quiz.apk` file na ho to dabane par "APK is coming soon" ka message aata hai.
- APK banane ke liye: pwabuilder.com > apni site ka link > Package for stores > Android > download. File ka naam `telenor-quiz.apk` kar ke repo ke root mein rakhein.
- Popup sirf Android par, har naye visit par ek baar aata hai. iPhone aur installed app mein nahi aata.
- APK ka naam ya jagah badalni ho to `aman.js` (aakhri hissa), `lib/template.html` (2 jagah) aur `vercel.json` mein badlein.

## Webhook (agar api.telegram.org phone par na khule)
Deploy ke baad browser mein kholein: `https://APNI-SITE/api/setup?key=WEBHOOK_SECRET`
`"ok":true` aur webhook ka url dikhna chahiye. Ye Vercel server se set hota hai, phone se Telegram kholne ki zaroorat nahi.
