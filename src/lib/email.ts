import nodemailer from 'nodemailer';

export async function sendNotificationEmail(reservation: any) {
    // 環境変数が設定されていない場合はログ出力のみ
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('Email configuration missing. Logging reservation details instead:');
        console.log(JSON.stringify(reservation, null, 2));
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Reservation System" <noreply@example.com>',
        to: 'lovelyatdusksea@gmail.com',
        subject: `【予約確定】${reservation.date} ${reservation.timeSlot} ${reservation.name}様`,
        text: `
新しい予約が入りました（即確定）。

日時: ${reservation.date} ${reservation.timeSlot}
人数: ${reservation.people}名
内訳: 日替わり定食 ${reservation.teishokuCount}名 / 席のみ ${reservation.seatOnlyCount}名
お名前: ${reservation.name} 様
電話番号: ${reservation.phone}
メモ: ${reservation.memo || 'なし'}

--------------------------------
このメールは自動送信されています。
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Notification email sent successfully.');
    } catch (error) {
        console.error('Failed to send notification email:', error);
    }
}
