// signInScript.js
import { auth, db } from "./firebase.js"; // 修正: dbもここからインポート
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// const db = getFirestore(); // これは削除

const homeButton = document.getElementById("homeButton");
const enterButton = document.getElementById("enterButton");

homeButton.addEventListener("click", () => {
  location.href = "index.html";
});

enterButton.addEventListener("click", async () => {
  const accountName = document.getElementById("accountName");
  const password = document.getElementById("password"); // 変数宣言を修正
  const rePassword = document.getElementById("rePassword");

  if (password.value !== rePassword.value) {
    alert("パスワードが一致しません");
    return;
  }

  const email = `${accountName.value}@example.com`;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password.value);
    const uid = userCredential.user.uid;

    await setDoc(doc(db, "users", uid), {
      accountName: accountName.value,
      uid: uid, // 念のため保存
      createdAt: new Date()
    });

    alert("サインイン完了！");
    location.href = "mypage.html"; // ログインページではなく直接マイページへ
  } catch (error) {
    alert("エラー: " + error.message);
  }
});
