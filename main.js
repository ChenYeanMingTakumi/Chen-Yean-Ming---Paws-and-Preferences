import{catUrls,preload,likesStore} from "./utils.js";

const N = 15;   // how many cats per run
const deck = document.getElementById("deck");
const likeBtn = document.getElementById("likeBtn");
const dislikeBtn = document.getElementById("dislikeBtn");
const resetBtn = document.getElementById("resetBtn");
const summaryEl = document.getElementById("summary");
const likedGrid = document.getElementById("likedGrid");
const summaryStats = document.getElementById("summaryStats");
const restartBtn = document.getElementById("restartBtn");
const controls = document.querySelector(".controls");

let queue = [];
let liked = likesStore.get();
let current = null;

init();

async function init() {
    queue = catUrls(N);
    await Promise.all(queue.slice(0,3).map(preload));
    renderNext();
    wireButtons();
    renderSummaryIfDone();
}

function wireButtons() {
    likeBtn.onclick = () => swipeDecision("right");
    dislikeBtn.onclick = () => swipeDecision("left");
    resetBtn.onclick = () => {
        likesStore.clear();
        liked = [];
        current = null;
        queue = [];
        deck.innerHTML = "";
        summaryEl.hidden = true;
        deck.hidden = false;
        controls.hidden = false;
        init();
        showToast("Reset complete");
    };
    restartBtn.onclick = () => {summaryEl.hidden = true; deck.hidden = false; controls.hidden = false; init();};
}

function renderNext() {
    if(!queue.length) return renderSummaryIfDone();

    const src = queue.shift();
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
        <img alt="A random cat" src="${src}" draggable="false" />
        <span class="badge like"  style="opacity:0">LIKE</span>
        <span class="badge nope"  style="opacity:0">NOPE</span>
    `;
    deck.prepend(card);
    if(queue[0]) preload(queue[0]);
    enableDrag(card,src);
    current = card;
}

function enableDrag(card,src) {
    let startX = 0,startY = 0,dx = 0,dy = 0;
    const thresh = 100;
    let isTracking = false;
    
    const onPointerDown = (e) => {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        dx = 0;
        dy = 0;
        isTracking = true;
        card.setPointerCapture(e.pointerID);
        card.style.transition = "none";
    }

    const onPointerMove = (e) => {
        if(!isTracking || !card.hasPointerCapture(e.pointerID)) return;
        e.preventDefault();
        dx = e.clientX - startX;
        dy = e.clientY - startY;
        
        // Only update if horizontal movement is dominant (swipe detection)
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if(absDx > absDy || absDx > 10) {
            const rot = dx / 15;
            card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
            card.querySelector(".badge.like").style.opacity = Math.max(0,Math.min(1,(dx / thresh)));
            card.querySelector(".badge.nope").style.opacity = Math.max(0,Math.min(1,(-dx / thresh)));
        }
    };

    const onPointerUp = (e) => {
        if(!isTracking) return;
        isTracking = false;
        card.releasePointerCapture(e.pointerID);
        
        // Determine swipe direction based on horizontal movement
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const decision = (absDx > absDy && absDx > thresh) 
            ? (dx > 0 ? "right" : "left") 
            : "snap";
        finishSwipe(decision,card,src,dx,dy);
    };

    const onPointerCancel = (e) => {
        isTracking = false;
        card.releasePointerCapture(e.pointerID);
        card.style.transition = "transform 220ms ease";
        card.style.transform = "translate(0,0) rotate(0)";
        card.querySelector(".badge.like").style.opacity = 0;
        card.querySelector(".badge.nope").style.opacity = 0;
    };

    card.addEventListener("pointerdown",onPointerDown);
    card.addEventListener("pointermove",onPointerMove);
    card.addEventListener("pointerup",onPointerUp);
    card.addEventListener("pointercancel",onPointerCancel);
}

function finishSwipe(type,card,src,dx,dy) {
    card.style.transition = "transform 220ms ease, opacity 220ms ease";

    if (type === "right" || type === "left") {
        const offX = (type === "right" ? window.innerWidth : -window.innerWidth);
        card.style.transform = `translate(${offX}px, ${dy}px) rotate(${dx/15}deg)`;
        card.style.opacity = 0;
        if(type === "right") like(src);
        setTimeout(() => {
            card.remove();
            renderNext();
            renderSummaryIfDone();
        },200);
    } else {
        card.style.transform = "translate(0,0) rotate(0)";
        card.querySelector(".badge.like").style.opacity = 0;
        card.querySelector(".badge.nope").style.opacity = 0;
    }
}

function swipeDecision(direction) {
    if(!current) return;
    finishSwipe(direction,current,current.querySelector("img").src,direction === "right" ? 140 : -140,0);
}

function like(src) {
    if(!liked.includes(src)) {
        liked.push(src);
        likesStore.set(liked);
    }
}

function renderSummaryIfDone() {
    const remaining = deck.querySelectorAll(".card").length + queue.length;
    if(remaining > 0) return;
    deck.hidden = true;
    summaryEl.hidden = false;
    controls.hidden = true;
    summaryStats.textContent = `You liked ${liked.length} out of ${N} cats.`;
    likedGrid.innerHTML = liked.map(u => `<img src="${u}" alt="Liked cat" />`).join("");
}

function showToast(msg) {
    const el = document.createElement("div");
    el.textContent = msg;
    Object.assign(el.style,{
        position:"fixed", left:"50%", bottom:"24px", transform:"translateX(-50%)",
        background:"#0f1720", color:"white", padding:"10px 14px",
        border:"1px solid #223247", borderRadius:"12px", boxShadow:"0 8px 24px rgba(0,0,0,.35)", zIndex:1000
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(),1400);
}
