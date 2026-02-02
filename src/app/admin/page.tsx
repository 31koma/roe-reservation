"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Trash2, Lock } from "lucide-react";

type Reservation = {
    id: string;
    date: string;
    timeSlot: string;
    name: string;
    phone: string;
    people: number;
    teishokuCount: number;
    seatOnlyCount: number;
    memo: string | null;
    status: string;
    createdAt: string;
};

export default function AdminPage() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (date) {
            fetchReservations(date);
        }
    }, [date]);

    const fetchReservations = async (selectedDate: Date) => {
        setLoading(true);
        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            const res = await fetch(`/api/admin/reservations?date=${dateStr}`);
            if (res.ok) {
                const data = await res.json();
                setReservations(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm("この予約をキャンセルしますか？")) return;

        try {
            const res = await fetch(`/api/reservations/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                if (date) fetchReservations(date);
            } else {
                alert("キャンセルに失敗しました");
            }
        } catch (err) {
            alert("エラーが発生しました");
        }
    };

    const handleBlock = async (slot: string) => {
        if (!date) return;
        if (!confirm(`${format(date, "M/d")} ${slot} をブロック（満席扱い）にしますか？`)) return;

        try {
            const res = await fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: format(date, "yyyy-MM-dd"),
                    timeSlot: slot,
                    name: "店舗ブロック",
                    phone: "000-0000-0000",
                    people: 6, // Max capacity to block
                    teishokuCount: 6,
                    seatOnlyCount: 0,
                    memo: "管理者によるブロック",
                }),
            });

            if (res.ok) {
                fetchReservations(date);
            } else {
                const data = await res.json();
                alert(`ブロック失敗: ${data.error}`);
            }
        } catch (err) {
            alert("エラーが発生しました");
        }
    };

    const slots = ["11:30", "12:15", "13:00"];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">予約管理画面</h1>
                    <Button variant="outline" onClick={() => window.location.href = "/"}>
                        予約ページへ
                    </Button>
                </div>

                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    <div className="bg-white p-4 rounded-lg shadow h-fit">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md"
                        />
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">
                            {date ? format(date, "yyyy年M月d日(E)", { locale: ja }) : "日付未選択"}
                        </h2>

                        {slots.map(slot => {
                            const slotReservations = reservations.filter(r => r.timeSlot === slot && (r.status === 'CONFIRMED' || r.status === 'PENDING'));
                            const totalPeople = slotReservations.reduce((sum, r) => sum + r.people, 0);
                            const isFull = totalPeople >= 6;

                            return (
                                <div key={slot} className={`p-6 rounded-lg shadow border-l-4 ${isFull ? 'bg-red-50 border-red-500' : 'bg-white border-green-500'}`}>
                                    <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-bold text-gray-800">{slot}</span>
                                            <span className={`text-sm px-3 py-1 rounded-full font-bold ${isFull ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {totalPeople} / 6名
                                            </span>
                                        </div>
                                        {!isFull && (
                                            <Button size="sm" variant="secondary" onClick={() => handleBlock(slot)}>
                                                <Lock className="w-4 h-4 mr-2" />
                                                ブロック
                                            </Button>
                                        )}
                                    </div>

                                    {slotReservations.length === 0 ? (
                                        <p className="text-gray-400 text-sm py-2">予約はありません</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {slotReservations.map(r => (
                                                <div key={r.id} className="flex justify-between items-center p-3 bg-white rounded border shadow-sm">
                                                    <div>
                                                        <div className="font-bold text-lg">
                                                            {r.name} <span className="text-sm font-normal text-gray-600">様</span>
                                                            <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded text-sm">{r.people}名</span>
                                                            <span className={`ml-2 text-xs px-2 py-1 rounded border ${r.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 border-green-200' :
                                                                r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {r.status === 'CONFIRMED' ? '確定' : r.status === 'PENDING' ? '承認待ち' : r.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1 font-medium">
                                                            定食: {r.teishokuCount} / 席のみ: {r.seatOnlyCount}
                                                        </div>
                                                        <div className="text-sm text-gray-600 font-mono mt-1">{r.phone}</div>
                                                        {r.memo && <div className="text-sm text-orange-600 mt-1">📝 {r.memo}</div>}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleCancel(r.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
