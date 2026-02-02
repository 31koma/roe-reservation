import BookingCalendar from "@/components/BookingCalendar";

export default function Home() {
    return (
        <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-[#faf9f6]">
            <div className="max-w-xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold tracking-wider text-gray-800 font-serif">
                        <span className="block text-sm font-normal text-gray-500 mb-2 uppercase tracking-widest">Reservation</span>
                        Roe’s Kitchen 予約
                    </h1>
                    <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
                        45分制のランチタイム予約<br />
                        <span className="text-xs text-gray-400">45-minute Lunch Details</span>
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8">
                    <BookingCalendar />
                </div>

                <div className="bg-white/60 rounded-xl p-6 text-center text-sm text-gray-600 space-y-6 border border-stone-100">
                    <div className="space-y-4">
                        <h2 className="font-serif text-base text-gray-800 border-b border-gray-200 pb-2 inline-block px-4">
                            Business Hours
                        </h2>

                        <div className="grid gap-4 text-sm">
                            <div>
                                <p className="font-bold text-gray-700">ランチ / Lunch</p>
                                <p>火〜金 (Tue-Fri) 11:30–14:00</p>
                                <p>土 (Sat) 11:30–16:00</p>
                            </div>

                            <div>
                                <p className="font-bold text-gray-700">ディナー / Dinner</p>
                                <p>火・水・木 (Tue-Thu) 18:00–20:30</p>
                            </div>

                            <div className="text-gray-500 text-xs">
                                <p>定休日：日曜日・月曜日</p>
                                <p>Closed: Sunday & Monday</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <p className="mb-2">変更・キャンセルはお電話にて承ります。</p>
                        <p className="text-xs text-gray-500 mb-2">For changes or cancellations, please call us.</p>
                        <a href="tel:0754965887" className="text-xl font-serif text-gray-800 hover:text-gray-600 transition-colors tracking-wide">075-496-5887</a>
                    </div>
                </div>
            </div>
        </main>
    );
}
