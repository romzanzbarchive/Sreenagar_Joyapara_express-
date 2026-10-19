const $ = (id) => document.getElementById(id);
const welcomeScreen = $("welcomeScreen");
const toast = $("toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

$("year").textContent = new Date().getFullYear();

function closeWelcome() {
  welcomeScreen.classList.add("hidden");
  try { sessionStorage.setItem("stje-welcome-seen", "yes"); } catch (_) {}
}
$("enterSite").addEventListener("click", closeWelcome);
$("headerWelcome").addEventListener("click", () => {
  welcomeScreen.classList.remove("hidden");
});
try {
  if (sessionStorage.getItem("stje-welcome-seen") === "yes") welcomeScreen.classList.add("hidden");
} catch (_) {}

$("photoInput").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return showToast("অনুগ্রহ করে একটি ছবি নির্বাচন করুন।");
  if (file.size > 5 * 1024 * 1024) return showToast("ছবির সাইজ ৫ MB-এর মধ্যে রাখুন।");
  const reader = new FileReader();
  reader.onload = () => {
    $("welcomePhoto").src = reader.result;
    $("welcomePhoto").hidden = false;
    $("photoPlaceholder").hidden = true;
    showToast("ছবির প্রিভিউ যোগ হয়েছে। এটি শুধু এই ব্রাউজারে থাকবে।");
  };
  reader.readAsDataURL(file);
});

function speakWelcome() {
  if (!("speechSynthesis" in window)) {
    showToast("এই ব্রাউজারে ভয়েস সুবিধা পাওয়া যাচ্ছে না।");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance("আসসালামু আলাইকুম। শ্রীনগর টু জয়পাড়া এক্সপ্রেসে স্বাগতম।");
  utterance.lang = "bn-BD";
  utterance.rate = 0.82;
  utterance.pitch = 0.9;
  window.speechSynthesis.speak(utterance);
}
$("welcomeVoice").addEventListener("click", speakWelcome);
$("mobileMenu").addEventListener("click", () => $("mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(link => link.addEventListener("click", () => $("mainNav").classList.remove("open")));

$("dismissPrayer").addEventListener("click", () => {
  $("prayerBanner").hidden = true;
  showToast("বার্তাটি এই পেজ থেকে বন্ধ করা হয়েছে।");
});

// Prayer message is intentionally shown as a demo banner, not as a verified live prayer-time alert.
$("bloodInfoBtn").addEventListener("click", () => {
  showToast("এটি ডেমো। লাইভ করতে যাচাইকৃত স্বেচ্ছাসেবী দাতা ও সম্মতিসহ তথ্য যোগ করতে হবে।");
});
$("privacyBtn").addEventListener("click", (e) => {
  e.preventDefault();
  showToast("লাইভ করার আগে গোপনীয়তা নীতি, সম্মতিভিত্তিক তথ্য সংগ্রহ ও নিরাপদ লগইন যোগ করুন।");
});

// Browser-only community demo. This does not publish posts to a real server.
function getPosts() {
  try { return JSON.parse(localStorage.getItem("stje-demo-posts") || "[]"); } catch (_) { return []; }
}
function renderPosts() {
  const list = $("postList");
  list.querySelectorAll(".user-post").forEach(node => node.remove());
  getPosts().slice().reverse().forEach(post => {
    const article = document.createElement("article");
    article.className = "community-post user-post";
    const head = document.createElement("div");
    head.className = "post-head";
    const avatar = document.createElement("div");
    avatar.className = "avatar avatar-soft";
    avatar.textContent = "আ";
    const details = document.createElement("div");
    const name = document.createElement("b");
    name.textContent = "কমিউনিটি সদস্য (ডেমো)";
    const time = document.createElement("small");
    time.textContent = post.time;
    details.append(name, time);
    head.append(avatar, details);
    const body = document.createElement("p");
    body.textContent = post.text;
    const actions = document.createElement("div");
    actions.className = "post-actions";
    actions.innerHTML = "<span>♡ কমিউনিটি পোস্ট</span><span>স্থানীয় উদ্যোগ</span>";
    article.append(head, body, actions);
    list.prepend(article);
  });
}
renderPosts();
$("publishPost").addEventListener("click", () => {
  const text = $("postText").value.trim();
  if (!text) return showToast("পোস্ট করার আগে কিছু লিখুন।");
  if (text.length > 1200) return showToast("পোস্টটি ১২০০ অক্ষরের মধ্যে রাখুন।");
  const posts = getPosts();
  posts.push({ text, time: new Date().toLocaleString("bn-BD") });
  try {
    localStorage.setItem("stje-demo-posts", JSON.stringify(posts.slice(-20)));
    $("postText").value = "";
    renderPosts();
    showToast("ডেমো পোস্ট যোগ হয়েছে—শুধু এই ব্রাউজারে দেখা যাবে।");
  } catch (_) {
    showToast("ব্রাউজারে পোস্ট সংরক্ষণ করা যায়নি।");
  }
});

// Poll demo: client-side only. It is not secure against duplicate votes or manipulation.
let poll = {
  question: "আমাদের এলাকার কোন উদ্যোগটি আগে নেওয়া উচিত?",
  options: ["পরিচ্ছন্নতা অভিযান", "রক্তদাতা নেটওয়ার্ক", "শিক্ষা সহায়তা"],
  votes: [0, 0, 0],
  voted: false
};
try {
  const saved = JSON.parse(localStorage.getItem("stje-demo-poll") || "null");
  if (saved && Array.isArray(saved.options) && Array.isArray(saved.votes)) poll = saved;
} catch (_) {}
function savePoll() {
  try { localStorage.setItem("stje-demo-poll", JSON.stringify(poll)); } catch (_) {}
}
function renderPoll() {
  $("pollQuestion").textContent = poll.question;
  const form = $("pollForm");
  form.innerHTML = "";
  poll.options.forEach((option, i) => {
    const label = document.createElement("label");
    label.className = "poll-option";
    const input = document.createElement("input");
    input.type = "radio"; input.name = "poll"; input.value = String(i);
    input.disabled = poll.voted;
    const span = document.createElement("span"); span.textContent = option;
    label.append(input, span); form.append(label);
  });
  const submit = document.createElement("button");
  submit.className = "btn btn-primary full-btn";
  submit.type = "submit";
  submit.textContent = poll.voted ? "আপনার ভোট দেওয়া হয়েছে" : "আমার ভোট দিন";
  submit.disabled = poll.voted;
  form.append(submit);
  $("pollResults").hidden = !poll.voted;
  $("pollNotice").textContent = poll.voted ? "ডেমো ফলাফল—শুধু এই ব্রাউজারে সংরক্ষিত।" : "এটি শুধু ব্রাউজার-ভিত্তিক ডেমো, প্রকৃত ভোট নয়।";
  renderResults();
}
function renderResults() {
  const results = $("pollResults");
  results.innerHTML = "";
  const total = poll.votes.reduce((sum, n) => sum + n, 0);
  poll.options.forEach((option, i) => {
    const row = document.createElement("div"); row.className = "result-row";
    const label = document.createElement("div"); label.className = "result-label";
    const name = document.createElement("span"); name.textContent = option;
    const pct = total ? Math.round((poll.votes[i] / total) * 100) : 0;
    const count = document.createElement("span"); count.textContent = `${pct}% · ${poll.votes[i]} ভোট`;
    label.append(name, count);
    const track = document.createElement("div"); track.className = "result-track";
    const fill = document.createElement("div"); fill.className = "result-fill"; fill.style.width = `${pct}%`;
    track.append(fill); row.append(label, track); results.append(row);
  });
}
$("pollForm").addEventListener("submit", e => {
  e.preventDefault();
  if (poll.voted) return showToast("এই ব্রাউজারে ইতিমধ্যে ভোট দেওয়া হয়েছে।");
  const selected = $("pollForm").querySelector('input[name="poll"]:checked');
  if (!selected) return showToast("ভোট দেওয়ার জন্য একটি উত্তর বেছে নিন।");
  poll.votes[Number(selected.value)] += 1;
  poll.voted = true;
  savePoll(); renderPoll();
  showToast("আপনার ডেমো ভোট গ্রহণ করা হয়েছে।");
});
$("adminToggle").addEventListener("click", () => {
  $("adminForm").hidden = !$("adminForm").hidden;
  $("adminToggle").textContent = $("adminForm").hidden ? "ডেমো অ্যাডমিন প্যানেল খুলুন" : "অ্যাডমিন প্যানেল বন্ধ করুন";
});
$("adminForm").addEventListener("submit", e => {
  e.preventDefault();
  const question = $("adminQuestion").value.trim();
  const a = $("adminOption1").value.trim();
  const b = $("adminOption2").value.trim();
  if (!question || !a || !b) return showToast("প্রশ্ন ও দুইটি বিকল্প পূরণ করুন।");
  poll = { question, options: [a, b], votes: [0, 0], voted: false };
  savePoll(); renderPoll();
  $("adminForm").reset();
  showToast("নতুন ডেমো ভোট তৈরি হয়েছে। মনে রাখুন: এটি নিরাপদ অ্যাডমিন সিস্টেম নয়।");
});
renderPoll();

// Leaflet map, with approximate area coordinates.
if (window.L) {
  const map = L.map("map", { scrollWheelZoom: false }).setView([23.62, 90.18], 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(map);
  const srinagar = L.marker([23.55, 90.28]).addTo(map).bindPopup("<b>শ্রীনগর</b><br>মুন্সিগঞ্জ");
  const joypara = L.marker([23.59, 90.14]).addTo(map).bindPopup("<b>জয়পাড়া</b><br>দোহার");
  L.polyline([[23.55,90.28],[23.59,90.14]], {color:"#0b6b50",weight:3,dashArray:"7 8"}).addTo(map);
  L.featureGroup([srinagar, joypara]).getBounds().pad(0.45);
  setTimeout(() => map.invalidateSize(), 250);
} else {
  $("map").innerHTML = '<div class="map-fallback">মানচিত্র লোড হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।</div>';
}
