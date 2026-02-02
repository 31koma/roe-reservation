"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Minus, Plus } from "lucide-react";

type Availability = {
    [key: string]: number;
};

export default function BookingCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [availability, setAvailability] = useState<Availability | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [people, setPeople] = useState(1);
    const [teishokuCount, setTeishokuCount] = useState(1);
    const [seatOnlyCount, setSeatOnlyCount] = useState(0);
    const [memo, setMemo] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (date) {
            fetchAvailability(date);
            setSelectedSlot(null);
        }
    }, [date]);

    // Reset breakdown when people count changes
    useEffect(() => {
        setTeishokuCount(people);
        setSeatOnlyCount(0);
    }, [people]);

    const fetchAvailability = async (selectedDate: Date) => {
        setLoading(true);
        setAvailability(null);
        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            const res = await fetch(`/api/availability?date=${dateStr}`);
            if (res.ok) {
                const data = await res.json();
                setAvailability(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !selectedSlot) return;

        if (teishokuCount + seatOnlyCount !== people) {
            setError("内訳の合計が予約人数と一致していません");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: format(date, "yyyy-MM-dd"),
                    timeSlot: selectedSlot,
                    name,
                    phone,
                    people,
                    teishokuCount,
                    seatOnlyCount,
                    memo,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === 'CUT_OFF') {
                    throw new Error(data.error);
                }
                throw new Error(data.error || "予約に失敗しました");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const isCutoff = () => {
        if (!date) return false;
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate.getTime() === today.getTime()) {
            return now.getHours() >= 10;
        }
        return false;
    };

    const isTodayCutoff = isCutoff();

    if (success) {
        return (
            <div className="text-center p-8 bg-blue-50/50 rounded-lg border border-blue-100">
                <h2 className="text-xl font-bold text-gray-800 mb-2 font-serif">予約が確定しました</h2>
                <p className="text-blue-600 mb-6 font-medium text-sm tracking-wide">Reservation Confirmed</p>

                <div className="space-y-4 mb-8 text-sm text-gray-700 leading-relaxed">
                    <p>
                        ご予約ありがとうございます。<br />
                        基本的にはこのままご来店いただけますが、<br />
                        万が一お席の調整が必要な場合のみ、<br />
                        店舗からお電話を差し上げることがあります。
                    </p>
                    <p className="text-xs text-gray-500 pt-2 border-t border-blue-100 mt-2">
                        Thank you for your reservation.<br />
                        In most cases, your booking is confirmed.<br />
                        If any seating adjustment is necessary,<br />
                        we may contact you by phone.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg border border-stone-100 text-sm text-gray-600 mb-8 mx-auto max-w-sm shadow-sm">
                    <p className="font-bold mb-3 border-b border-stone-100 pb-2 text-gray-800">ご予約内容 / Details</p>
                    <div className="space-y-2 text-left">
                        <div className="flex justify-between">
                            <span className="text-gray-500">日時 (Date)</span>
                            <span className="font-medium text-gray-900">{date && format(date, "yyyy/MM/dd", { locale: ja })} {selectedSlot}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">人数 (People)</span>
                            <span className="font-medium text-gray-900">{people}名</span>
                        </div>
                        <div className="pt-2 text-xs text-gray-500">
                            定食 (Set Meal): {teishokuCount} / 席のみ (Seat Only): {seatOnlyCount}
                        </div>
                    </div>
                </div>

                <div className="mb-8 text-sm">
                    <p className="mb-1 text-gray-700">変更・キャンセルはお電話でお願いいたします。</p>
                    <p className="text-xs text-gray-500 mb-3">For changes or cancellations, please call us.</p>
                    <a href="tel:0754965887" className="text-xl font-serif text-gray-800 hover:text-gray-600 border-b border-gray-300 pb-0.5">075-496-5887</a>
                </div>

                <Button
                    className="w-full sm:w-auto bg-stone-800 hover:bg-stone-700 text-white"
                    onClick={() => {
                        setSuccess(false);
                        setDate(new Date());
                        setName("");
                        setPhone("");
                        setPeople(1);
                        setTeishokuCount(1);
                        setSeatOnlyCount(0);
                        setMemo("");
                        setSelectedSlot(null);
                    }}
                >
                    新しい予約をする (New Reservation)
                </Button>
            </div>
        );
    }

    const remainingAllocation = people - (teishokuCount + seatOnlyCount);

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">日付を選択 <span className="text-sm font-normal text-gray-500">(Select Date)</span></h3>
                <div className="border rounded-md p-4 bg-white shadow-sm inline-block">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        disabled={(date) => {
                            const day = date.getDay();
                            // Disable if date is in the past OR is Sunday (0) OR is Monday (1)
                            return date < new Date(new Date().setHours(0, 0, 0, 0)) || day === 0 || day === 1;
                        }}
                    />
                </div>
                <div className="mt-4 text-sm text-gray-500">
                    <p>※5名様以上のご予約はお電話にて承ります。</p>
                    <p className="text-xs mb-1">For parties of 5 or more, please call us.</p>
                    <p className="font-bold text-lg mt-1">075 496 5887</p>
                    <p className="text-xs mt-2 text-red-500">※当日のWeb予約は朝10:00まで<br />(Same-day web reservations accepted until 10:00 AM)</p>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">
                    {date ? format(date, "M月d日(E)", { locale: ja }) : "日付未選択"} の空き状況 <span className="text-sm font-normal text-gray-500"> (Availability)</span>
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : availability ? (
                    <div className="space-y-4">
                        {isTodayCutoff && (
                            <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm mb-4 font-bold">
                                本日のWeb予約受付は終了しました（10:00締切）。<br />
                                お電話にてお問い合わせください。<br />
                                <span className="text-xs font-normal">Online reservations for today are closed (10:00 AM cutoff). Please call us.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                            {["11:30", "12:15", "13:00"].map((slot) => {
                                const remaining = availability[slot];
                                const isFull = remaining === 0;
                                const isSelected = selectedSlot === slot;
                                const disabled = isFull || isTodayCutoff;

                                return (
                                    <button
                                        key={slot}
                                        onClick={() => !disabled && setSelectedSlot(slot)}
                                        disabled={disabled}
                                        className={`
                      p-3 rounded-lg border text-center transition-all duration-200
                      ${disabled
                                                ? "bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100"
                                                : isSelected
                                                    ? "bg-stone-800 text-white border-stone-800 ring-2 ring-stone-200 ring-offset-2 shadow-md"
                                                    : "bg-white hover:border-stone-400 hover:bg-stone-50 border-gray-200 shadow-sm"
                                            }
                    `}
                                    >
                                        <div className="font-serif text-lg tracking-wide">{slot}</div>
                                        <div className="text-[10px] sm:text-xs mt-1 font-medium tracking-wide">
                                            {isTodayCutoff ? <span>受付終了<br /><span className="mx-0.5 opacity-70">Closed</span></span> : isFull ? <span>満席<br /><span className="mx-0.5 opacity-70">Fully Booked</span></span> : <span>空きあり<br /><span className="mx-0.5 opacity-70">Available</span></span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedSlot && (
                            <form onSubmit={handleSubmit} className="mt-8 space-y-6 border-t pt-6 animate-in fade-in slide-in-from-top-4">
                                <div className="bg-blue-50 p-4 rounded-md text-blue-900 text-sm">
                                    <span className="font-bold">{selectedSlot}</span> 〜 45分制となります。<span className="text-xs ml-2 text-blue-700">(45-minute limit)</span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium block mb-2">合計人数 / Total People (1〜4)</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={people}
                                            onChange={(e) => setPeople(Number(e.target.value))}
                                            required
                                        >
                                            {[1, 2, 3, 4].map((num) => (
                                                <option
                                                    key={num}
                                                    value={num}
                                                    disabled={availability[selectedSlot] < num}
                                                >
                                                    {num}名 {availability[selectedSlot] < num ? "(空きなし/Full)" : ""}
                                                </option>
                                            ))}
                                        </select>
                                        {people > availability[selectedSlot] && (
                                            <p className="text-red-500 text-xs mt-1">
                                                ※選択された人数分の空きがありません (Not enough seats available)
                                            </p>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                        <label className="text-sm font-medium block text-gray-700">内訳を指定してください (Please specify order)</label>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm"><div>日替わり定食<div className="text-xs text-gray-500">Daily Set Meal</div></div></span>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setTeishokuCount(Math.max(0, teishokuCount - 1))}
                                                    disabled={teishokuCount <= 0}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-4 text-center font-bold">{teishokuCount}</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setTeishokuCount(Math.min(people, teishokuCount + 1))}
                                                    disabled={teishokuCount >= people}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm"><div>席のみ<div className="text-xs text-gray-500">Seat Only</div></div></span>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setSeatOnlyCount(Math.max(0, seatOnlyCount - 1))}
                                                    disabled={seatOnlyCount <= 0}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-4 text-center font-bold">{seatOnlyCount}</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setSeatOnlyCount(Math.min(people, seatOnlyCount + 1))}
                                                    disabled={seatOnlyCount >= people}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className={`text-xs text-right ${remainingAllocation !== 0 ? 'text-red-500 font-bold' : 'text-green-600'}`}>
                                            {remainingAllocation === 0
                                                ? "OK"
                                                : <div>残り {remainingAllocation}名の割り当てが必要です<br />Please allocate {remainingAllocation} more people</div>
                                            }
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">お名前 / Name <span className="text-red-500">*</span></label>
                                    <Input
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="例：山田 太郎 / Taro Yamada"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">電話番号 / Phone <span className="text-red-500">*</span></label>
                                    <Input
                                        required
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="例：090-1234-5678"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">メモ (任意) / Note (Optional)</label>
                                    <Input
                                        value={memo}
                                        onChange={(e) => setMemo(e.target.value)}
                                        placeholder="アレルギーなどあればご記入ください / Any special requests"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-stone-800 hover:bg-stone-700 text-white py-6 text-base tracking-wide shadow-sm"
                                    disabled={submitting || people > availability[selectedSlot] || remainingAllocation !== 0}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            処理中... (Processing)
                                        </>
                                    ) : (
                                        "予約する (Book a Table)"
                                    )}
                                </Button>
                                <p className="text-xs text-center text-gray-500 mt-2">
                                    ※送信ボタンを押すと即座に予約が確定します。<br />
                                    (Reservation is confirmed immediately.)
                                </p>
                            </form>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-500">日付を選択してください (Please select a date)</div>
                )}
            </div>
        </div>
    );
}
