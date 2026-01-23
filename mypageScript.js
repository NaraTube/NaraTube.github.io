import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ★★★ ここにあなたのGASのURLを貼り付けてください ★★★
const GAS_URL = "https://script.google.com/macros/s/AKfycbzDwPlLRsm9tJlRDRdAvoesBWGBiy8sMYyuqNiX6221RyXLLu-sP1kZuFiK_CZexH_k/exec";

let currentUser = null;

console.log("Script loaded: mypageScript.js is running"); // 読み込み確認用ログ

// 1. ログイン情報の保持チェック
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        const label = document.getElementById("userLabel");
        if(label) label.textContent = `ログイン中: ${user.email.split('@')[0]}`;
        loadVideos();
    } else {
        location.href = "login.html";
    }
});

// 2. 動画のアップロード機能 (XHR版・最強版)
const upBtn = document.getElementById("upBtn");
if (upBtn) {
    upBtn.addEventListener("click", async () => {
        const fileInput = document.getElementById("vFile");
        const titleInput = document.getElementById("vTitle");
        const status = document.getElementById("upStatus");

        if (!fileInput || !titleInput) return;

        const file = fileInput.files[0];
        const title = titleInput.value;

        if (!file || !title) {
            alert("ファイルとタイトルを入力してください");
            return;
        }
        
        status.textContent = "準備中... (GASと通信)";

        try {
            // --- ファイル形式の補完 ---
            let mimeType = file.type;
            if (!mimeType && file.name.toUpperCase().endsWith(".MOV")) mimeType = "video/quicktime";
            if (!mimeType) mimeType = "video/mp4";

            // --- STEP 1: GASへ送信してセッションURLを取得 ---
            const resGas = await fetch(GAS_URL, {
                method: "POST",
                body: JSON.stringify({ fileName: title, mimeType: mimeType })
            });
            
            const gasText = await resGas.text();
            let gasData;
            try { gasData = JSON.parse(gasText); } catch (e) { throw new Error("GASエラー: " + gasText); }
            
            if (gasData.status === "error") throw new Error(gasData.message);
            const sessionUrl = gasData.sessionUrl;

            // --- STEP 2: XHRを使ってGoogleドライブへ直接アップロード ---
            status.textContent = "アップロード開始... 0%";

            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", sessionUrl);
                
                // Content-Typeヘッダーをあえて空にする（Googleの自動判定に任せる）
                // これによりCORSエラーを回避しやすくなります
                
                // 進捗（プログレス）表示
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        status.textContent = `アップロード中... ${percentComplete}%`;
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
                    }
                };

                xhr.onerror = () => reject(new Error("ネットワークエラー (Failed to fetch)"));
                
                xhr.send(file);
            }).then(async (uploadResult) => {
                // --- STEP 3: Firebaseに保存 ---
                status.textContent = "データベースに登録中...";
                const fileId = uploadResult.id;
                const videoUrl = `https://drive.google.com/file/d/${fileId}/preview`;

                await addDoc(collection(db, "videos"), {
                    uid: currentUser.uid,
                    title: title,
                    url: videoUrl,
                    createdAt: new Date()
                });

                status.textContent = "完了しました！";
                alert("動画のアップロードが完了しました！");
                titleInput.value = "";
                fileInput.value = "";
                loadVideos();
            });

        } catch (e) {
            console.error(e);
            status.textContent = "エラー: " + e.message;
            alert("エラーが発生しました: " + e.message);
        }
    });
}

// 3. 動画の視聴機能
async function loadVideos() {
    const listArea = document.getElementById("videoList");
    if (!listArea) return;

    listArea.innerHTML = "読み込み中...";
    
    if (!currentUser) return;

    try {
        const q = query(collection(db, "videos"), where("uid", "==", currentUser.uid));
        const snap = await getDocs(q);
        
        listArea.innerHTML = "";
        if (snap.empty) {
            listArea.innerHTML = "<p>動画はまだありません。</p>";
            return;
        }

        snap.forEach(doc => {
            const v = doc.data();
            listArea.innerHTML += `
                <div style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h4>${v.title}</h4>
                    <iframe src="${v.url}" width="320" height="240" allow="autoplay"></iframe>
                </div>
            `;
        });
    } catch (e) {
        console.error("読み込みエラー:", e);
        listArea.textContent = "動画の読み込みに失敗しました";
    }
}

// ログアウト機能
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        signOut(auth).then(() => {
            alert("ログアウトしました");
            location.href = "login.html";
        });
    });
}
