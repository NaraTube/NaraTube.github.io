import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Cloudflare WorkerのURL
// ※変更不要（元のURLのままです）
const WORKER_BASE_URL = "https://naratube-proto2.s25a5001jt.workers.dev"; 

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

// 2. 動画リスト読み込み（新デザイン対応版）
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
            listArea.innerHTML = "<p style='padding:20px; text-align:center;'>動画はありません。</p>";
            return;
        }

        snap.forEach(doc => {
            const v = doc.data();
            
            // ファイルID抽出
            let fileId = "";
            const match = v.url.match(/\/d\/(.+?)\//);
            if (match) fileId = match[1];
            else return;

            // 日付のフォーマット（あれば）
            let dateStr = "";
            if (v.createdAt && v.createdAt.toDate) {
                const d = v.createdAt.toDate();
                dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
            }

            // --- ここが変更点: 新しいCSSクラス構造に合わせてHTMLを作成 ---
            const div = document.createElement("div");
            div.className = "video-item"; // CSSのスタイルが適用されます
            div.innerHTML = `
                <div class="video-title">▷ ${v.title}</div>
                <div class="video-date">
                    <span>${dateStr}</span>
                    <span style="margin-left: 10px; opacity: 0.7;">ID: ${fileId.substring(0, 6)}...</span>
                </div>
            `;
            // -------------------------------------------------------

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

// 3. 動画再生処理（修正版）
function playVideo(fileId, title, clickedElement) {
    // HTMLの修正に合わせてIDを取得
    const playerContainer = document.getElementById("playerContainer");
    const playerMessage = document.getElementById("playerMessage");
    const videoTag = document.getElementById("mainVideo");
    
    // Cloudflare経由のURLを作成
    const proxyUrl = `${WORKER_BASE_URL}/${fileId}`;
    console.log("動画URL:", proxyUrl);

    // --- ここが変更点: 表示の切り替えロジック ---
    
    // 1. 「動画を選択してください」メッセージを隠す
    if (playerMessage) {
        playerMessage.style.display = "none";
    }

    // 2. プレイヤーのコンテナを表示する
    if (playerContainer) {
        playerContainer.style.display = "block";
    }

    // 3. 動画ソースをセットして再生
    videoTag.src = proxyUrl;
    videoTag.load(); 
    videoTag.play().catch(e => console.log("自動再生ブロック:", e));

    // 4. リストの見た目を更新（選択中のものを青くする）
    document.querySelectorAll(".video-item").forEach(el => el.classList.remove("active"));
    if (clickedElement) {
        clickedElement.classList.add("active");
    }

    // 5. スマホでリストの下の方をクリックした場合、上（プレイヤー）までスクロール
    // PCではあまり動かないように少し条件をつけてもいいですが、単純にトップへ戻す形でOK
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 4. ログアウト
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    if (confirm("ログアウトしますか？")) {
        signOut(auth).then(() => location.href = "login.html");
    }
});
