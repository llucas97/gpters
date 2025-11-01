const puppeteer = require('puppeteer');
const path = require('path');

async function convertHtmlToPng() {
    console.log('🚀 브라우저 실행 중...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // 10000 x 11000 픽셀로 viewport 설정
        await page.setViewport({
            width: 10000,
            height: 11000,
            deviceScaleFactor: 1
        });

        console.log('📄 HTML 파일 로딩 중...');
        
        // HTML 파일 경로 (절대 경로로 변환)
        const htmlPath = path.resolve(__dirname, 'gpters_poster.html');
        await page.goto(`file://${htmlPath}`, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        console.log('⏳ 렌더링 완료 대기 중...');
        
        // 폰트 및 렌더링 완료 대기
        await page.evaluateHandle('document.fonts.ready');
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('📸 스크린샷 생성 중...');
        
        // PNG로 스크린샷 저장
        await page.screenshot({
            path: 'gpters_poster.png',
            type: 'png',
            fullPage: false, // viewport 크기만큼만 캡처
            omitBackground: false
        });

        console.log('✅ 완료! gpters_poster.png 파일이 생성되었습니다.');
        console.log('📐 크기: 10000 x 11000 픽셀');
        
    } catch (error) {
        console.error('❌ 오류 발생:', error);
    } finally {
        await browser.close();
    }
}

convertHtmlToPng();

