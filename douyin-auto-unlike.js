// 获取所有 localStorage 键
const allKeys = Object.keys(localStorage);

// 目标密钥名称的列表，按优先级顺序
const possibleKeys = [
    'security-sdk/s_sdk_cert_key',   // 原来的密钥存储键名
    'security-sdk/s_sdk_crypt_sdk',  // 你的新密钥存储键名
    // 如果将来有其他可能的密钥存储键，可以添加到此处
];

let keyData = null;

// 自动查找密钥数据
for (let key of possibleKeys) {
    if (allKeys.includes(key)) {
        const storedData = localStorage.getItem(key);
        if (storedData) {
            try {
                keyData = JSON.parse(storedData);
                console.log(`Found key data in localStorage under key: ${key}`);
                console.log("keyData: ", keyData);  // 输出 keyData 以便调试
                break;
            } catch (error) {
                console.error(`Failed to parse data from key ${key}:`, error);
            }
        }
    }
}

// 如果没有找到任何密钥，抛出错误并停止执行
if (!keyData) {
    console.error('No valid key data found in localStorage.');
    throw new Error('Required data missing in localStorage.');
}

// 输出 keyData 的结构，确保能正确获取到 keyData.data
console.log("Key Data Structure: ", keyData);

// 解析 keyData.data 字符串以获取密钥
let keyDetails = JSON.parse(keyData.data);  // 解析 data 字符串

// 输出 keyDetails 以便确认是否正确解析
console.log("Parsed Key Details: ", keyDetails);

// 提取 privateKey 和 publicKey
let privateKey = keyDetails?.ec_privateKey || '';
let publicKey = keyDetails?.ec_publicKey || '';

// 输出 privateKey 和 publicKey 以便调试
console.log("Private Key: ", privateKey);
console.log("Public Key: ", publicKey);

if (!privateKey || !publicKey) {
    console.error('Private or Public key is missing.');
    throw new Error('Keys are missing.');
}

// 继续执行后续操作，使用 privateKey 和 publicKey 进行加密或解密操作
let max_cursorTemp = 0;
let messageBox = undefined;

var count = 0;

async function fetchAndCancelLikes(maxCursor = max_cursorTemp) {
    try {
        const response = await fetch(`https://www.douyin.com/aweme/v1/web/aweme/favorite?aid=6383&count=999&max_cursor=${max_cursorTemp}`, {
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors",
            "credentials": "include"
        });
        const { aweme_list, max_cursor } = await response.json();
        max_cursorTemp = max_cursor;

        if (aweme_list != null) {
            const idsToCancel = aweme_list.map(({ aweme_id }) => aweme_id);
            let currCount = 0;
            await Promise.all(idsToCancel.map(id => {
                cancelLike(id, privateKey);  // 使用 privateKey 取消点赞
                currCount++;
                count++;
            })).then(() => {
                if (messageBox != undefined) {
                    document.body.removeChild(messageBox);
                }
                messageBox = showMessageBox(`本次执行取消${currCount}个点赞,共取消${count}个点赞,四秒后继续执行,如果不需要执行直接关闭浏览器,当前时间${new Date()}`);
            });
        }

    } catch (error) {
        console.error('Error fetching and canceling likes:', error);
    }
}

async function cancelLike(id, key) {
    try {
        await fetch("https://www.douyin.com/aweme/v1/web/commit/item/digg/?aid=6383", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "zh-CN,zh;q=0.9",
                "bd-ticket-guard-ree-public-key": key,
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            "referrer": "https://www.douyin.com/user/self?modal_id=7308336895358930212&showTab=like",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": `aweme_id=${id}&item_type=0&type=0`,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
    } catch (error) {
        console.error(`Error canceling like for aweme_id ${id}:`, error);
    }
}

setInterval(fetchAndCancelLikes, 4000);

function showMessageBox(mess) {
    var messageBox = document.createElement('div');
    messageBox.id = 'autoMessageBox';
    messageBox.style.position = 'fixed';
    messageBox.style.top = '50%';
    messageBox.style.left = '50%';
    messageBox.style.transform = 'translate(-50%, -50%)';
    messageBox.style.padding = '20px';
    messageBox.style.backgroundColor = '#3498db';
    messageBox.style.color = 'white';
    messageBox.style.borderRadius = '5px';
    messageBox.style.zIndex = '1000';
    messageBox.style.display = 'block';
    messageBox.textContent = mess;
    document.body.appendChild(messageBox);
    return messageBox;
}
