import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testReceiptImageField() {
  try {
    console.log('Testing receipt image field in Payment model...');
    
    // Check if the field exists by trying to query it
    const payments = await prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        receiptImagePath: true
      },
      take: 5
    });
    
    console.log('✅ Payment model with receiptImagePath field is working correctly');
    console.log('Sample payments:', payments);
    
    // Test creating a payment with receipt image path
    const testPayment = await prisma.payment.create({
      data: {
        userInstallmentId: payments[0]?.id || 'test-id',
        paymentDate: new Date(),
        amount: 1000000,
        description: 'Test payment',
        receiptImagePath: 'test/receipt/path.jpg'
      }
    });
    
    console.log('✅ Successfully created payment with receipt image path:', testPayment);
    
    // Clean up test data
    await prisma.payment.delete({
      where: { id: testPayment.id }
    });
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Error testing receipt image field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReceiptImageField();

