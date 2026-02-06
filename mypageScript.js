import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Cloudflare WorkerのURL
const WORKER_BASE_URL = "https://naratube-proto2.s25a5001jt.workers.dev"; // ← 必ず自分のURLか確認！

let currentUser = null;

// 1. ログイン監視
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        const label = document.getElementById("userLabel");
        if(label) label.textContent = user.email.split('@')[0];
        loadVideoList();
    } else {
        location.href = "login.html";
    }
});

// 2. 動画リスト読み込み
async function loadVideoList() {
    const listArea = document.getElementById("videoList");
    
    try {
        const q = query(
            collection(db, "videos"), 
            where("uid", "==", currentUser.uid),
            orderBy("createdAt", "desc")
        );
        
        const snap = await getDocs(q);
        
        listArea.innerHTML = "";
        if (snap.empty) {
            listArea.innerHTML = "<p style='padding:20px;'>動画はありません。</p>";
            return;
        }

        snap.forEach(doc => {
            const v = doc.data();
            
            // ファイルID抽出
            let fileId = "";
            const match = v.url.match(/\/d\/(.+?)\//);
            if (match) fileId = match[1];
            else return;

            // リストアイテムを作成
            const div = document.createElement("div");
            div.className = "video-item";
            div.innerHTML = `
                <p class="video-title">▷ ${v.title}</p>
                <span class="video-date">ID: ${fileId.substring(0, 6)}...</span>
            `;

            // クリック時の動作を設定
            div.addEventListener("click", () => {
                playVideo(fileId, v.title, div);
            });

            listArea.appendChild(div);
        });

    } catch (e) {
        console.error("Error:", e);
        listArea.innerHTML = "<p>リスト読み込みエラー: " + e.message + "</p>";
    }
}

// 3. 動画再生処理
function playVideo(fileId, title, clickedElement) {
    const playerContainer = document.getElementById("playerContainer");
    const playerMessage = document.getElementById("playerMessage");
    const videoTag = document.getElementById("mainVideo");
    
    // Cloudflare経由のURL
    const proxyUrl = `${WORKER_BASE_URL}/${fileId}`;
    console.log("動画URL:", proxyUrl);

    // プレイヤーを表示
    playerMessage.style.display = "none";
    playerContainer.style.display = "block";

    // ソースをセットして再生
    videoTag.src = proxyUrl;
    videoTag.load(); // 読み込み開始
    videoTag.play().catch(e => console.log("自動再生ブロック:", e)); // 自動再生試行

    // 選択状態の見た目を更新
    document.querySelectorAll(".video-item").forEach(el => el.classList.remove("active"));
    clickedElement.classList.add("active");

    // 上部へスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 4. ログアウト
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    if (confirm("ログアウトしますか？")) {
        signOut(auth).then(() => location.href = "login.html");
    }
});
