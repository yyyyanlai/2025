/*
----- Coding Tutorial by Patt Vira ----- 
Name: Interactive Bridge w Bouncing Balls (matter.js + ml5.js)
Video Tutorial: https://youtu.be/K7b5MEhPCuo

Connect with Patt: @pattvira
https://www.pattvira.com/
----------------------------------------
*/

// ml5.js 
let handPose;
let video;
let hands = [];

const THUMB_TIP = 4;
const INDEX_FINGER_TIP = 8;

// Matter.js 
const {Engine, Body, Bodies, Composite, Composites, Constraint, Vector} = Matter;
let engine;
let bridge; let num = 10; let radius = 10; let length = 25;
let circles = [];
let stack = []; // 用於存放接到的文字

let colorPalette = ["#abcd5e", "#14976b", "#2b67af", "#62b6de", "#f589a3", "#ef562f", "#fc8405", "#f9d531"]; 

let names = [
  "陳慶帆", "顧大維", "林逸農", "賴婷玲", "鍾志鴻", "羅時豐", "李弘毅", 
  "曾國城", "李多慧", "南珉貞", "吳宗憲", "峮峮", "林香", "香蕉哥哥", 
  "周杰倫", "粥餅倫"
];

let gameStarted = false; // 用於判斷遊戲是否開始
let gameEnded = false; // 用於判斷遊戲是否結束
let timer = 15; // 倒數計時秒數
let score = 0; // 分數
let validNames = ["陳慶帆", "顧大維", "林逸農", "賴婷玲", "鍾志鴻"]; // 有效得分的名字

class Circle {
  constructor() {
    this.x = random(width); // 隨機生成文字的初始 x 座標
    this.y = 0; // 初始 y 座標設為 0（從畫面頂部開始下落）
    this.done = false; // 是否完成的標記
    this.name = names[int(random(names.length))]; // 隨機選擇名字
  }

  checkDone() {
    // 檢查文字是否超出畫面底部
    this.done = this.y > height;
  }

  displayText() {
    fill(random(255), random(255), random(255)); // 隨機顏色
    textSize(20); // 設定文字大小
    text(this.name, this.x, this.y); // 顯示文字
    this.y += 2; // 模擬下落效果
  }

  removeCircle() {
    // 移除邏輯（目前不需要額外處理）
  }
}

function preload() {
  // Load the handPose model
  handPose = ml5.handPose({maxHands: 1, flipped: true});
}


function setup() {
  createCanvas(640, 480);
  // Create the webcam video and hide it
  video = createCapture(VIDEO, {flipped: true});
  video.size(640, 480);
  video.hide();
  // start detecting hands from the webcam video
  handPose.detectStart(video, gotHands);
  
  
  engine = Engine.create();
  bridge = new Bridge(num, radius, length);
}

function draw() {
  if (!gameStarted) {
    // 遊戲開始畫面
    background(220);
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(0);
    text("請問哪些是淡江教科系的老師", width / 2, height / 2 - 50);
    textSize(20);
    text("按下任意鍵開始遊戲", width / 2, height / 2 + 50);
    return; // 暫停遊戲邏輯，直到遊戲開始
  }

  if (gameEnded) {
    // 遊戲結束畫面
    background(220);
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(0);
    text("遊戲結束！", width / 2, height / 2 - 50);
    textSize(20);
    text(`您的分數是：${score}`, width / 2, height / 2 + 50);
    return; // 暫停遊戲邏輯
  }

  background(220);
  Engine.update(engine);
  strokeWeight(2);
  stroke(0);
  
  // Draw the webcam video
  image(video, 0, 0, width, height);
  
  // 倒數計時顯示在右上角
  textSize(20);
  fill(0);
  text(`倒數：${timer}秒`, width - 100, 30);

  // 每秒減少倒數計時
  if (frameCount % 60 === 0 && timer > 0) {
    timer--;
  }

  // 如果倒數計時結束，遊戲結束
  if (timer === 0) {
    gameEnded = true;
  }

  // 隨機生成新的文字物件
  if (random() < 0.1) {
    circles.push(new Circle());
  }
  
  // 更新並繪製所有文字物件
  for (let i = circles.length - 1; i >= 0; i--) {
    circles[i].checkDone();
    circles[i].displayText(); // 顯示文字
    
    if (hands.length > 0) {
      let thumb = hands[0].keypoints[THUMB_TIP];
      let index = hands[0].keypoints[INDEX_FINGER_TIP];
      
      // 檢查文字是否接到拇指和食指
      if (dist(circles[i].x, circles[i].y, thumb.x, thumb.y) < 20 || dist(circles[i].x, circles[i].y, index.x, index.y) < 20) {
        stack.push(circles[i].name); // 將接到的文字加入堆疊
        if (validNames.includes(circles[i].name)) {
          score++; // 如果接到有效名字，增加分數
        }
        circles.splice(i, 1); // 移除接到的文字
        continue;
      }
    }
    
    if (circles[i].done) {
      circles.splice(i, 1); // 移除完成的物件
    }
  }
  
  if (hands.length > 0) {
    let thumb = hands[0].keypoints[THUMB_TIP];
    let index = hands[0].keypoints[INDEX_FINGER_TIP];
    
    // 顯示拇指和食指的位置
    fill(0, 255, 0);
    noStroke();
    textSize(16);
    text("拇指", thumb.x, thumb.y);
    text("食指", index.x, index.y);
    
    bridge.bodies[0].position.x = thumb.x;
    bridge.bodies[0].position.y = thumb.y;
    bridge.bodies[bridge.bodies.length - 1].position.x = index.x;
    bridge.bodies[bridge.bodies.length - 1].position.y = index.y;
    bridge.display();
    
    // 繪製堆疊的文字在鍊條中間
    let stackX = (thumb.x + index.x) / 2; // 堆疊的 X 座標為拇指和食指的中間
    let stackY = (thumb.y + index.y) / 2; // 堆疊的 Y 座標為拇指和食指的中間
    for (let i = 0; i < stack.length; i++) {
      fill(255, 0, 0);
      textSize(20);
      text(stack[i], stackX, stackY - i * 20); // 堆疊文字向上排列
    }
  }
}

// Callback function for when handPose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}

// 遊戲開始的按鍵事件
function keyPressed() {
  if (!gameStarted) {
    gameStarted = true; // 按下任意鍵開始遊戲
  }
}
