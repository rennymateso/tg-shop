"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "../../components/BottomNav";
import {
  getTelegramInitData,
  getTelegramWebApp,
} from "../../lib/telegram-mini-app";

type CustomerAddress = {
  id: string;
  label: string;
  city: string | null;
  street: string | null;
  house: string | null;
  apartment: string | null;
  comment: string | null;
  is_default: boolean;
};

function formatAddress(address: CustomerAddress) {
  const parts = [
    address.city ? `г. ${address.city}` : "",
    address.street ? `ул. ${address.street}` : "",
    address.house ? `д. ${address.house}` : "",
    address.apartment ? `кв. ${address.apartment}` : "",
  ].filter(Boolean);

  return parts.join(", ");
}

export default function ProfileAddressesPage() {
  const router = useRouter();
  const initData = getTelegramInitData();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState("");

  const [label, setLabel] = useState("Дом");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");
  const [apartment, setApartment] = useState("");
  const [comment, setComment] = useState("");

  const resetForm = () => {
    setEditingAddressId("");
    setLabel("Дом");
    setCity("");
    setStreet("");
    setHouse("");
    setApartment("");
    setComment("");
  };

  const loadAddresses = async () => {
    if (!initData) {
      setAddresses([]);
      setLoadingAddresses(false);
      return;
    }

    setLoadingAddresses(true);

    const response = await fetch(
      `/api/customer/addresses?initData=${encodeURIComponent(initData)}`
    );
    const result = await response.json();

    if (response.ok && result?.success && Array.isArray(result.addresses)) {
      setAddresses(result.addresses);
    } else {
      setAddresses([]);
    }

    setLoadingAddresses(false);
  };

  useEffect(() => {
    const init = async () => {
      const webApp = getTelegramWebApp();
      webApp?.ready();
      webApp?.expand();
      await loadAddresses();
    };

    init();
  }, []);

  const handleSaveAddress = async () => {
    if (!city.trim() || !street.trim() || !house.trim()) {
      alert("Заполните город, улицу и дом");
      return;
    }

    setSavingAddress(true);

    const response = await fetch("/api/customer/addresses", {
      method: editingAddressId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        editingAddressId
          ? {
              initData,
              addressId: editingAddressId,
              label,
              city,
              street,
              house,
              apartment,
              comment,
            }
          : {
              initData,
              label,
              city,
              street,
              house,
              apartment,
              comment,
              is_default: addresses.length === 0,
            }
      ),
    });

    const result = await response.json();

    if (!response.ok || !result?.success) {
      alert(result?.error || "Не удалось сохранить адрес");
      setSavingAddress(false);
      return;
    }

    resetForm();
    await loadAddresses();
    setSavingAddress(false);
  };

  const handleEditAddress = (address: CustomerAddress) => {
    setEditingAddressId(address.id);
    setLabel(address.label || "Дом");
    setCity(address.city || "");
    setStreet(address.street || "");
    setHouse(address.house || "");
    setApartment(address.apartment || "");
    setComment(address.comment || "");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleMakeDefault = async (addressId: string) => {
    const response = await fetch("/api/customer/addresses", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        initData,
        addressId,
        is_default: true,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result?.success) {
      alert(result?.error || "Не удалось обновить адрес");
      return;
    }

    await loadAddresses();
  };

  const handleDeleteAddress = async (addressId: string) => {
    const response = await fetch("/api/customer/addresses", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        initData,
        addressId,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result?.success) {
      alert(result?.error || "Не удалось удалить адрес");
      return;
    }

    if (editingAddressId === addressId) {
      resetForm();
    }

    await loadAddresses();
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 pt-[76px] pb-32">
      <div className="mb-5 flex items-center justify-center">
        <h1 className="text-[20px] font-medium">Мои адреса</h1>
      </div>

      <div className="mb-4 rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
        <h2 className="text-[18px] font-medium text-black">Сохранённые адреса</h2>

        <div className="mt-4 space-y-3">
          {loadingAddresses ? (
            <p className="text-sm text-gray-400">Загрузка адресов...</p>
          ) : addresses.length === 0 ? (
            <p className="text-sm text-gray-400">Адресов пока нет</p>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-[20px] bg-[#F7F7F7] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-black">
                        {address.label}
                      </p>
                      {address.is_default && (
                        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                          Основной
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {formatAddress(address)}
                    </p>

                    {address.comment ? (
                      <p className="mt-2 text-xs text-gray-400">
                        {address.comment}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(address.id)}
                    className="text-xs text-gray-400"
                  >
                    удалить
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => handleEditAddress(address)}
                    className="text-sm text-black underline underline-offset-2"
                  >
                    Редактировать
                  </button>

                  {!address.is_default && (
                    <button
                      type="button"
                      onClick={() => handleMakeDefault(address.id)}
                      className="text-sm text-black underline underline-offset-2"
                    >
                      Сделать основным
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.05)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[18px] font-medium text-black">
            {editingAddressId ? "Редактировать адрес" : "Добавить адрес"}
          </h2>

          {editingAddressId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-gray-500"
            >
              Отмена
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          >
            <option>Дом</option>
            <option>Работа</option>
            <option>Другой адрес</option>
          </select>

          <input
            placeholder="Город *"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />

          <div className="grid grid-cols-[1fr_88px_110px] gap-2">
            <input
              placeholder="Улица *"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />

            <input
              placeholder="Дом *"
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />

            <input
              placeholder="Кв."
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
            />
          </div>

          <textarea
            placeholder="Комментарий (подъезд, этаж, код домофона и другое)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-2xl bg-[#F5F5F5] p-3.5 text-sm outline-none"
          />

          <button
            type="button"
            onClick={handleSaveAddress}
            disabled={savingAddress}
            className="w-full rounded-2xl bg-black py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {savingAddress
              ? editingAddressId
                ? "Сохраняем изменения..."
                : "Сохраняем..."
              : editingAddressId
              ? "Сохранить изменения"
              : "Сохранить адрес"}
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}