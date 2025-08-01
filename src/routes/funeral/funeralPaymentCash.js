import express from 'express';
import * as paymentService from '../../services/funeral/funeralPaymentCashService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/prepare', authMiddleware, async (req, res) => {
  const { merchantUid, amount } = req.body;
  const { funeralId } = req.user;

  try {
    const result = await paymentService.preparePayment({
      merchantUid,
      amount,
      funeralId,
    });
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Payment Prepare Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.post('/webhook', async (req, res) => {
  const { imp_uid, merchant_uid, status } = req.body;

  try {
    const result = await paymentService.processWebhook({ imp_uid, merchant_uid, status });
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.post('/verify', async (req, res) => {
  const { imp_uid, merchant_uid, amount } = req.body;
  try {
    const result = await paymentService.verifyPayment({ imp_uid, merchant_uid, amount });
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
