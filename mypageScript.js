import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ★ ステップ2でコピーしたGASのURLに書き換えてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbxYsAY036kVQNa1YohVQ0Ae1L5y_cQJ_zxNSN5vv1D20SDEcSFjJ4mOpvoC1hv7lN9_/exec";

let currentUser = null;

// 4. ログイン情報の保持チェック
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById("userLabel").textContent = `ログイン中: ${user.email.split('@')[0]}`;
        loadVideos();
    } else {
        location.href = "login.html";
    }
});

// 2. 動画のアップロード機能 (GAS経由)
document.getElementById("upBtn").addEventListener("click", async () => {
    const file = document.getElementById("vFile").files[0];
    const title = document.getElementById("vTitle").value;
    const status = document.getElementById("upStatus");

    if (!file || !title) return alert("タイトルとファイルを選んでください");
    //if (file.size > 50 * 1024 * 1024) return alert("50MB以上のファイルはアップロードできません");

    status.textContent = "処理中...（これには数分かかる場合があります）";

    // ファイルをBase64に変換
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        
        try {
            const response = await fetch(GAS_URL, {
                method: "POST",
                body: JSON.stringify({
                    fileName: title + "_" + Date.now(),
                    mimeType: file.type,
                    base64: base64Data
                })
            });
            const resData = await response.json();

            if (resData.status === "success") {
                // 3. 動画情報の保存（Firestore）
                // 埋め込み用にURLを変換
                const embedUrl = resData.url.replace('/view?usp=drivesdk', '/preview').replace('/view', '/preview');

                await addDoc(collection(db, "videos"), {
                    uid: currentUser.uid,
                    title: title,
                    videoUrl: embedUrl,
                    createdAt: new Date()
                });

                status.textContent = "アップロード成功！";
                loadVideos();
            } else {
                throw new Error(resData.message);
            }
        } catch (e) {
            console.error(e);
            status.textContent = "エラー: " + e.message;
        }
    };
});

// 3. 動画の視聴機能
async function loadVideos() {
    const listArea = document.getElementById("videoList");
    listArea.innerHTML = "読み込み中...";
    
    const q = query(collection(db, "videos"), where("uid", "==", currentUser.uid));
    const snap = await getDocs(q);
    
    listArea.innerHTML = "";
    snap.forEach(doc => {
        const v = doc.data();
        listArea.innerHTML += `
            <div style="margin-bottom:20px;">
                <h4>${v.title}</h4>
                <iframe src="${v.videoUrl}" width="320" height="240"></iframe>
            </div>
        `;
    });
}

// ログアウト
document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));
