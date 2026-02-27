"use client";

import { useSearchParams } from "next/navigation";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const [resultStatus, setResultStatus] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("トークンが見つかりません");
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch(`/api/verify?token=${token}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus("success");
                    setResultStatus(data.status);
                    if (data.alreadyProcessed) {
                        setMessage("この予約は既に処理されています。");
                    }
                } else {
                    setStatus("error");
                    setMessage(data.error || "エラーが発生しました");
                }
            } catch (err) {
                setStatus("error");
                setMessage("通信エラーが発生しました");
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                {status === "loading" && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-gray-600">処理中...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center">
                        {resultStatus === "CONFIRMED" ? (
                            <>
                                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                                <h1 className="text-2xl font-bold text-gray-800 mb-2">予約を承認しました</h1>
                                <p className="text-gray-600 mb-6">予約ステータスは「確定」になりました。</p>
                            </>
                        ) : (
                            <>
                                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                                <h1 className="text-2xl font-bold text-gray-800 mb-2">予約を却下しました</h1>
                                <p className="text-gray-600 mb-6">予約ステータスは「却下」になりました。</p>
                            </>
                        )}
                        {message && <p className="text-sm text-yellow-600 mb-4">{message}</p>}
                        <Button onClick={() => window.location.href = "/admin"}>
                            管理画面へ戻る
                        </Button>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center">
                        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">エラー</h1>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <Button onClick={() => window.location.href = "/admin"}>
                            管理画面へ戻る
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
