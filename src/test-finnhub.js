import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

async function testGetNews() {
  console.log('🔍 กำลังทดสอบ Finnhub API...\n');
  
  // ตรวจสอบ API Key
  if (!FINNHUB_API_KEY) {
    console.error('❌ ไม่พบ FINNHUB_API_KEY ใน .env');
    console.error('กรุณาเพิ่ม FINNHUB_API_KEY=xxxxx ใน .env\n');
    return;
  }
  
  console.log(`✅ API Key: ${FINNHUB_API_KEY.substring(0, 10)}...`);
  
  try {
    // 1. ทดสอบดึงข่าวทั่วไป
    console.log('\n📰 กำลังดึงข่าวล่าสุด...');
    const newsResponse = await axios.get(`${BASE_URL}/news`, {
      params: {
        category: 'general',
        token: FINNHUB_API_KEY
      }
    });
    
    console.log(`✅ พบข่าว ${newsResponse.data.length} ข่าว\n`);
    
    // แสดง 3 ข่าวแรก
    newsResponse.data.slice(0, 3).forEach((news, index) => {
      console.log(`--- ข่าวที่ ${index + 1} ---`);
      console.log(`📌 หัวข้อ: ${news.headline}`);
      console.log(`🏢 แหล่งที่มา: ${news.source}`);
      console.log(`🕐 เวลา: ${new Date(news.datetime * 1000).toLocaleString('th-TH')}`);
      console.log(`🔗 URL: ${news.url}`);
      if (news.summary) {
        console.log(`📝 สรุป: ${news.summary.substring(0, 100)}...`);
      }
      console.log('');
    });
    
    // 2. ทดสอบดึงราคาหุ้น Apple
    console.log('\n💰 กำลังดึงราคาหุ้น AAPL...');
    const quoteResponse = await axios.get(`${BASE_URL}/quote`, {
      params: {
        symbol: 'AAPL',
        token: FINNHUB_API_KEY
      }
    });
    
    const quote = quoteResponse.data;
    console.log('✅ ข้อมูลราคา AAPL:');
    console.log(`   ราคาปัจจุบัน: $${quote.c}`);
    console.log(`   ราคาเปิด: $${quote.o}`);
    console.log(`   ราคาสูงสุด: $${quote.h}`);
    console.log(`   ราคาต่ำสุด: $${quote.l}`);
    console.log(`   เปลี่ยนแปลง: ${quote.d} (${quote.dp}%)`);
    
    // 3. ทดสอบค้นหาหุ้น
    console.log('\n🔎 กำลังค้นหาหุ้น Tesla...');
    const searchResponse = await axios.get(`${BASE_URL}/search`, {
      params: {
        q: 'Tesla',
        token: FINNHUB_API_KEY
      }
    });
    
    console.log(`✅ พบหุ้น ${searchResponse.data.count} รายการ`);
    searchResponse.data.result.slice(0, 3).forEach((stock, index) => {
      console.log(`   ${index + 1}. ${stock.symbol} - ${stock.description}`);
    });
    
    console.log('\n🎉 ทดสอบสำเร็จ! API ทำงานได้ปกติ');
    
  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('\n⚠️  API Key ไม่ถูกต้อง! กรุณาตรวจสอบใน .env');
      } else if (error.response.status === 429) {
        console.error('\n⚠️  เกิน Rate Limit! ลองใหม่ในภายหลัง');
      }
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n⚠️  ไม่สามารถเชื่อมต่ออินเทอร์เน็ต');
    }
  }
}

// รันฟังก์ชันทดสอบ
testGetNews();