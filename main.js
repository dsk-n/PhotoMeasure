let markers;
let imgData, imgWidth, imgHeight, drawImageRatio;;
let Reference0, Reference1, Reference99;

let realMarkerSize = 46.5; //millimeters
let img = null;
let detector = new AR.Detector({
    dictionaryName: 'ARUCO_MIP_36h12',
    maxHammingDistance: 1
});

const inptCamera = document.getElementById('upload');
const inptImage = document.getElementById('uploadSrc');
const targetId0 = document.getElementById('targetMarker0');
const targetId1 = document.getElementById('targetMarker1');
const statusArea = document.getElementById('statusWindow');

targetId0.addEventListener('click', function () {
    this.select()
}, false)
targetId1.addEventListener('click', function () {
    this.select()
}, false)

const markerSize = document.getElementById('markerSize')//.valueAsNumber
markerSize.addEventListener('click', function () {
    this.select()
}, false)

document.getElementById("spin-btn0minus").addEventListener("click", (event) => {
    const target = document.getElementById("targetMarker0")
    if (target.value > 0 ) target.stepDown();
});
document.getElementById("spin-btn0plus").addEventListener("click", (event) => {
    document.getElementById("targetMarker0").stepUp();
});
document.getElementById("spin-btn1minus").addEventListener("click", (event) => {
    const target = document.getElementById("targetMarker1")
    if (target.value > 0 ) target.stepDown();
});
document.getElementById("spin-btn1plus").addEventListener("click", (event) => {
    document.getElementById("targetMarker1").stepUp();
});

//読み込み画像を描画するCanvas
const org_canvas0 = document.getElementById("org_canvas0");
const org_canvas = document.getElementById("org_canvas_preview");
const org_context0 = org_canvas0.getContext("2d", { willReadFrequently: true });
const org_context = org_canvas.getContext("2d");
org_canvas.width = parseInt(org_canvas.style.width);
org_canvas.height = parseInt(org_canvas.style.height);

//マーカーを準正四角形に変形して描画するCanvas
const transform_canvas0 = document.getElementById("transform_canvas0");
const transform_canvas = document.getElementById("transform_canvas_preview");
const transform_context0 = transform_canvas0.getContext("2d", { willReadFrequently: true });
const transform_context = transform_canvas.getContext("2d");
transform_canvas.width = parseInt(transform_canvas.style.width);
transform_canvas.height = parseInt(transform_canvas.style.height);

//カメラ撮影時の処理
inptCamera.addEventListener('change', function (e) {
    var capture = e.target.files[0];
    var cameraReader = new FileReader();
    img = new Image();
    cameraReader.onload = function (e) {
        statusArea.value += "\n" + '－－－読み込み処理中－－－'
        statusArea.scrollTop = statusArea.scrollHeight;
        img.setAttribute("src", cameraReader.result);
        preview(img);

    };
    cameraReader.readAsDataURL(capture);
});

//画像選択時の処理
inptImage.addEventListener('change', function (e) {
    var file = e.target.files[0];
    var imageReader = new FileReader();
    img = new Image();
    imageReader.onload = function (e) {
        statusArea.value += "\n" + '－－－読み込み処理中－－－'
        statusArea.scrollTop = statusArea.scrollHeight;
        img.setAttribute("src", imageReader.result);
        preview(img);
    };
    imageReader.readAsDataURL(file);
});
inptImage.addEventListener('click', (e) => {
    e.target.value = '';
})

//画像のプレビュー
function preview(img) {
    //canvas初期化
    org_context0.clearRect(0, 0, org_canvas.width, org_canvas.height);
    org_context.clearRect(0, 0, org_canvas.width, org_canvas.height);
    transform_context0.clearRect(0, 0, transform_canvas0.width, transform_canvas0.height);
    transform_context.clearRect(0, 0, transform_canvas.width, transform_canvas.height);

    let markerList;

    img.onload = function () {
        imgWidth = img.naturalWidth;
        imgHeight = img.naturalHeight;

        //元画像をオリジナルサイズで非表示Canvasに描画
        const sizeLimitOn = document.getElementById('sizeLimitSizeCheckBox');
        if (sizeLimitOn.checked) {
            var imgWidthLimitRatio = 1920 / imgWidth;
            var imgHeightLimitRatio = 1920 / imgHeight;
            var imgLimitRatio;
            if (imgWidthLimitRatio < imgHeightLimitRatio) {
                imgLimitRatio = imgWidthLimitRatio;
            } else {
                imgLimitRatio = imgHeightLimitRatio;
            };
            if (imgLimitRatio > 1) {
                imgLimitRatio = 1;
            };
            imgWidth *= imgLimitRatio;
            imgHeight *= imgLimitRatio;

        }//else{
        org_canvas0.width = imgWidth;
        org_canvas0.height = imgHeight;
        //};

        //元画像をプレビュー描画
        drawImageRatio = canvasDrawImage(img, imgWidth, imgHeight, org_canvas, org_context)

        canvasDrawImage(img, imgWidth, imgHeight, org_canvas0, org_context0)

        imageData = org_context0.getImageData(0, 0, imgWidth, imgHeight);

        markers = detector.detect(imageData);
        console.log('loadingPic:')
        console.log(markers)

        if (markers.length == 0) {
            statusArea.value += "\n" + 'マーカーを認識できませんでした'
            statusArea.scrollTop = statusArea.scrollHeight;
            //modalContent.innerHTML = 'マーカーを認識できませんでした';
            //modalOpen();
        };
        if (markers.length == 1) {
            statusArea.value += "\n" + 'マーカーを認識できませんでした'
            statusArea.scrollTop = statusArea.scrollHeight;
            console.log(markers)
            //modalContent.innerHTML += 'マーカーを１つしか認識できませんでした';
            //modalOpen();
            targetId0.value = markers[0].id
            targetId1.value = markers[0].id
        };

        drawCorners(markers, org_context, drawImageRatio);
        statusArea.value += "\n" + '読み込み画像でマーカーが' + markers.length + '点認識されました'
        statusArea.scrollTop = statusArea.scrollHeight;

        //マーカーが４つ（基準点3つ＋目標点１つならば解析を行う
        if (markers.length == 4) {
            for (i = 0; i < markers.length; ++i) {
                if (markers[i].id == 1) {
                    targetId0.value = markers[i].id
                };
                if (markers[i].id != 0 && markers[i].id != 1 && markers[i].id != 99) {
                    targetId1.value = markers[i].id
                };
            };
            analysis();
        };
    };
};

//距離解析
function analysis(e) {
    if (img == null) {
        statusArea.value += "\n" + '画像を選択してください'
        statusArea.scrollTop = statusArea.scrollHeight;
        //modalContent.innerHTML = '画像を選択してください';
        //modalOpen();
        return false;
    };

    realMarkerSize = Number(markerSize.value);
    if (typeof realMarkerSize != 'number') {
        statusArea.value += "\n" + 'マーカー実辺長に数字を入力してください'
        statusArea.scrollTop = statusArea.scrollHeight;
        return false;
    };

    const id0 = targetId0.valueAsNumber
    const id1 = targetId1.valueAsNumber
    if (isNaN(id0) || isNaN(id1)) {
        statusArea.value += "\n" + 'マーカーIDに正しい数字を入力してください'
        statusArea.scrollTop = statusArea.scrollHeight;
        return false;
    };

    //canvas初期化
    console.log('canvas')
    transform_context0.clearRect(0, 0, transform_canvas0.width, transform_canvas0.height);
    transform_context.clearRect(0, 0, transform_canvas.width, transform_canvas.height);
    transform_canvas.width = transform_canvas.width;

    const transformImg = transform(markers, id0, imgWidth, imgHeight, img, transform_canvas0, transform_context0)
    const tranceform_imageData = transform_context0.getImageData(0, 0, transform_canvas0.width, transform_canvas0.height);

    const tranceform_markers = detector.detect(tranceform_imageData);
    if (tranceform_markers.length == 0) {
        statusArea.value += "\n" + '解析画像のマーカーを認識できませんでした'
        statusArea.scrollTop = statusArea.scrollHeight;
    };
    let checkMarkerId0 = 0;
    let checkMarkerId1 = 0;
    let noDetect = 0;
    for (i = 0; i < tranceform_markers.length; ++i) {
        if (tranceform_markers[i].id == id0) {
            checkMarkerId0 = -100;
        } else {
            checkMarkerId0 += 1;
        };
        if (tranceform_markers[i].id == id1) {
            checkMarkerId1 = -100;
        } else {
            checkMarkerId1 += 1;
        };
    };
    if (checkMarkerId0 > 0 && checkMarkerId1 > 0) {
        statusArea.value += "\n" + '目標マーカーを認識できませんでした'
        statusArea.scrollTop = statusArea.scrollHeight;
        noDetect = 1;
    } else {
        if (checkMarkerId0 > 0) {
            statusArea.value += "\n" + '基準点マーカーを認識できませんでした'
            statusArea.scrollTop = statusArea.scrollHeight;
            noDetect = 1;
        }
        if (checkMarkerId1 > 0) {
            statusArea.value += "\n" + '目標点マーカーを認識できませんでした'
            statusArea.scrollTop = statusArea.scrollHeight;
            noDetect = 1;
        }
    };
    if ( noDetect == 0) {
        var transformImgWidth = transformImg.width;
        var transformImgHeight = transformImg.height;
        drawImageRatio = canvasDrawImage(transform_canvas0, transformImgWidth, transformImgHeight, transform_canvas, transform_context);
        drawCorners(tranceform_markers, transform_context, drawImageRatio);
    };

    //基準点と目標点距離の算出
    let result;
    if (id0 != id1 && checkMarkerId0 < 0 && checkMarkerId1 < 0) {
        const target0 = calcIntersection(tranceform_markers, id0);
        const target1 = calcIntersection(tranceform_markers, id1);
        //calcIntersectionの戻り値 [ id, intersection_x, intersection_y, sideLength_ave ]
        result = distance2D(target0[1], target0[2], target1[1], target1[2], target0[3], target1[3], transform_context, drawImageRatio);
    };
    if ( isNaN(result)) {
        result = '---'
    } else {
        result = Math.round(result * 10) / 10;
    }
        statusArea.value += "\nid:" + id0 + ' - id:' + id1 + ' 解析が終了しました ' + result + 'mm';
    statusArea.scrollTop = statusArea.scrollHeight;

    //基準点の3マーカー（0，1，99）の距離を算出
    var Reference0, Reference1, Reference99;


};


//Canvasに画像を描画
function canvasDrawImage(img, Width, Height, canvas, ctx) {
    let imgRatio;
    let canvasRatio_x = canvas.width / Width
    let canvasRatio_y = canvas.height / Height
    if (canvasRatio_x < canvasRatio_y) {
        imgRatio = canvasRatio_x;
    } else {
        imgRatio = canvasRatio_y;
    };
    let drawImage_x = Width * imgRatio;
    let drawImage_y = Height * imgRatio;
    ctx.drawImage(img, 0, 0, drawImage_x, drawImage_y);
    return imgRatio;
};

function drawCorners(drawMarkers, ctx, ratio) {
    let id, corners, corner, i, j;
    ctx.lineWidth = 1;
    for (i = 0; i < drawMarkers.length; ++i) {
        id = drawMarkers[i].id;
        corners = drawMarkers[i].corners;
        ctx.strokeStyle = "red";
        ctx.beginPath();
        for (j = 0; j < corners.length; ++j) {
            corner = corners[j];
            ctx.moveTo(corner.x * ratio, corner.y * ratio);
            corner = corners[(j + 1) % corners.length];
            ctx.lineTo(corner.x * ratio, corner.y * ratio);
        }
        ctx.stroke();
        ctx.closePath();

        var markerCenter = calcIntersection(drawMarkers, id)
        const text_x = markerCenter[1] * ratio;
        const text_y = markerCenter[2] * ratio;
        ctx.font = '12pt Arial';
        ctx.fillStyle = 'rgba(0, 255, 255)';
        ctx.fillText(' id:' + markerCenter[0], text_x, text_y);
    }
};

function calcIntersection(markers, id) {
    let corner_x = [], corner_y = [];
    let marker = markers.find(e => e.id === id);
    for (i = 0; i < marker.corners.length; ++i) {
        corner_x[i] = marker.corners[i].x
        corner_y[i] = marker.corners[i].y
    };

    //四辺の距離を求める(時計回り)
    const x_up = Math.sqrt((corner_x[0] - corner_x[1]) ** 2 + (corner_y[0] - corner_y[1]) ** 2)
    const x_bottom = Math.sqrt((corner_x[1] - corner_x[2]) ** 2 + (corner_y[1] - corner_y[2]) ** 2)
    const y_left = Math.sqrt((corner_x[2] - corner_x[3]) ** 2 + (corner_y[2] - corner_y[3]) ** 2)
    const y_right = Math.sqrt((corner_x[3] - corner_x[0]) ** 2 + (corner_y[3] - corner_y[0]) ** 2)
    //四辺の距離の平均を求める
    const sideLength_ave = (x_up + x_bottom + y_left + y_right) / 4
    // 4点の交点を求める
    const SurfaceArea1 = ((corner_x[3] - corner_x[1]) * (corner_y[0] - corner_y[1]) - (corner_y[3] - corner_y[1]) * (corner_x[0] - corner_x[1])) / 2;
    const SurfaceArea2 = ((corner_x[3] - corner_x[1]) * (corner_y[1] - corner_y[2]) - (corner_y[3] - corner_y[1]) * (corner_x[1] - corner_x[2])) / 2;
    const intersection_x = corner_x[0] + (corner_x[2] - corner_x[0]) * SurfaceArea1 / (SurfaceArea1 + SurfaceArea2)
    const intersection_y = corner_y[0] + (corner_y[2] - corner_y[0]) * SurfaceArea1 / (SurfaceArea1 + SurfaceArea2)

    let Result = [];
    Result = [marker.id, intersection_x, intersection_y, sideLength_ave]
    return Result;
};


function distance2D(x0, y0, x1, y1, sideLength0, sideLength1, ctx, ratio) {
    const markerLength_ave = (sideLength0 + sideLength1) / 2
    const distCenter_px = Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2)
    const distCenter_mm = distCenter_px * (realMarkerSize / markerLength_ave)
    console.log("distCenter(2D):" + distCenter_mm)

    ctx.beginPath();//十字線
    ctx.lineWidth = 1;
    ctx.strokeStyle = "red";
    ctx.moveTo((x0 - 50) * ratio, y0 * ratio);
    ctx.lineTo((x0 + 50) * ratio, y0 * ratio);
    ctx.stroke();
    ctx.moveTo(x0 * ratio, (y0 - 50) * ratio);
    ctx.lineTo(x0 * ratio, (y0 + 50) * ratio);
    ctx.stroke();
    ctx.closePath();
    ctx.moveTo((x1 - 50) * ratio, y1 * ratio);
    ctx.lineTo((x1 + 50) * ratio, y1 * ratio);
    ctx.stroke();
    ctx.moveTo(x1 * ratio, (y1 - 50) * ratio);
    ctx.lineTo(x1 * ratio, (y1 + 50) * ratio);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "yellow";
    ctx.moveTo(x0 * ratio, y0 * ratio);
    ctx.lineTo(x1 * ratio, y1 * ratio);
    ctx.stroke();
    ctx.closePath();
    ctx.font = '16pt Arial';
    ctx.fillStyle = 'rgba(20, 200, 255)';
    const text_x = (x0 + (x1 - x0) / 2) * ratio;
    const text_y = (y0 + (y1 - y0) / 2) * ratio;
    ctx.fillText(Math.round(distCenter_mm * 10) / 10 + 'mm', text_x, text_y);

    return distCenter_mm;
};


function transform(markers, id, imgWidth, imgHeight, img, canvas, ctx) {
    let marker_x = [], marker_y = [];
    let marker = markers.find(e => e.id === id);
    if (!marker) {
        statusArea.value += "\n" + '指定したマーカーIDを確認してください'
        statusArea.scrollTop = statusArea.scrollHeight;
        return;
    }
    for (i = 0; i < marker.corners.length; ++i) {
        marker_x[i] = marker.corners[i].x// + imgWidth / 2;
        marker_y[i] = marker.corners[i].y// + imgHeight / 2;
    };
    var srcPts = [[marker_x[0], marker_y[0]], [marker_x[1], marker_y[1]],
    [marker_x[2], marker_y[2]], [marker_x[3], marker_y[3]]];
    const aX = marker_x[1] - marker_x[0];
    const aY = marker_y[1] - marker_y[0];

    const transform_x0 = marker_x[0];
    const transform_y0 = marker_y[0];
    const transform_x1 = marker_x[1];
    const transform_y1 = marker_y[1];
    const transform_x2 = marker_x[1] - aY;
    const transform_y2 = marker_y[1] + aX;
    const transform_x3 = marker_x[0] - aY;
    const transform_y3 = marker_y[0] + aX;
    const dstPts = [[transform_x0, transform_y0], [transform_x1, transform_y1],
        [transform_x2, transform_y2], [transform_x3, transform_y3]];

    const myHomography = new homography.Homography();
    myHomography.setReferencePoints(srcPts, dstPts);
    const resultImage = myHomography.warp(img);

    canvas.width = resultImage.width;
    canvas.height = resultImage.height;
    ctx.putImageData(resultImage, 0, 0);

    return resultImage;
};
