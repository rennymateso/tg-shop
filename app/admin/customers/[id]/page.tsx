"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, MessageCircle, PackageOpen, Phone } from "lucide-react";
import { supabase } from "../../../lib/supabase";

type CustomerRow = {
  id: string;
  telegram_user_id: number | null;
  telegram_username: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  photo_url: string | null;
  created_at?: string;
  updated_at?: string;
};

type OrderRow = {
  id: string;
  total: number;
  status: string;
  delivery: string;
  address: string;
  created_at?: string;
};

type AddressRow = {
  id: string;
  city?: string | null;
  street?: string | null;
  house?: string | null;
  flat?: string | null;
  address?: string | null;
};

function formatPrice(value: number) {
  return Number(value || 0).toLocaleString("ru-RU");
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAddressLabel(address: AddressRow) {
  return (
    address.address ||
    [address.city, address.street, address.house, address.flat].filter(Boolean).join(", ") ||
    "Адрес без названия"
  );
}

export default function AdminCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");

  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fullName = useMemo(() => {
    return [customer?.first_name, customer?.last_name].filter(Boolean).join(" ").trim();
  }, [customer]);

  const telegramLink = customer?.telegram_username
    ? `https://t.me/${customer.telegram_username}`
    : customer?.telegram_user_id
      ? `tg://user?id=${customer.telegram_user_id}`
      : "";

  useEffect(() => {
    const loadCustomer = async () => {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .maybeSingle<CustomerRow>();

      if (error || !data) {
        setCustomer(null);
        setMessage(error?.message || "Клиент не найден");
        setLoading(false);
        return;
      }

      setCustomer(data);

      const [{ data: ordersData }, { data: addressesData }] = await Promise.all([
        supabase
          .from("orders")
          .select("id,total,status,delivery,address,created_at")
          .eq("customer_id", id)
          .order("created_at", { ascending: false }),
        supabase.from("customer_addresses").select("*").eq("customer_id", id),
      ]);

      setOrders((ordersData || []) as OrderRow[]);
      setAddresses((addressesData || []) as AddressRow[]);
      setLoading(false);
    };

    if (id) loadCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-[20px] bg-white p-5 text-[13px] text-slate-500 shadow-sm">
        Загружаем клиента...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-[20px] bg-white p-5 text-[13px] text-red-600 shadow-sm">
        {message || "Клиент не найден"}
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 -mx-2 mb-2 border-b border-slate-100 bg-white px-2 py-2">
        <div className="grid grid-cols-[36px_1fr_36px] items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center text-slate-400"
            aria-label="Назад"
          >
            <ArrowLeft size={23} />
          </button>
          <div className="min-w-0 text-center">
            <h1 className="truncate text-[18px] font-semibold text-black">
              {fullName || "Клиент"}
            </h1>
            <p className="mt-0.5 truncate text-[12px] text-slate-400">
              {customer.telegram_username ? `@${customer.telegram_username}` : customer.id}
            </p>
          </div>
          <span />
        </div>
      </header>

      <section className="mb-2 rounded-[20px] bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f4f6fb] text-[20px] font-semibold text-slate-400">
            {customer.photo_url ? (
              <img src={customer.photo_url} alt={fullName || "Клиент"} className="h-full w-full object-cover" />
            ) : (
              (fullName || "К").charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-black">{fullName || "Имя не указано"}</p>
            <p className="mt-0.5 truncate text-[13px] text-slate-500">{customer.phone || "Телефон не указан"}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {telegramLink ? (
            <a
              href={telegramLink}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#0969ff] text-[12px] font-semibold text-white"
            >
              <MessageCircle size={16} />
              Написать
            </a>
          ) : (
            <button className="flex h-10 items-center justify-center rounded-xl bg-[#f4f6fb] text-[12px] text-slate-400" disabled>
              Нет Telegram
            </button>
          )}
          {customer.phone ? (
            <a
              href={`tel:${customer.phone}`}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#f4f6fb] text-[12px] font-semibold text-black"
            >
              <Phone size={16} />
              Позвонить
            </a>
          ) : (
            <button className="flex h-10 items-center justify-center rounded-xl bg-[#f4f6fb] text-[12px] text-slate-400" disabled>
              Нет телефона
            </button>
          )}
        </div>
      </section>

      <section className="mb-2 rounded-[20px] bg-white p-3 shadow-sm">
        <h2 className="text-[15px] font-semibold text-black">Заказы</h2>
        <div className="mt-2 space-y-2">
          {orders.length === 0 ? (
            <p className="rounded-2xl bg-[#f4f6fb] p-4 text-center text-[13px] text-slate-500">
              Заказов пока нет
            </p>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[#f4f6fb] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-black">{order.id}</p>
                  <p className="mt-0.5 truncate text-[12px] text-slate-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-semibold text-black">{formatPrice(order.total)} ₽</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{order.status}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="mb-20 rounded-[20px] bg-white p-3 shadow-sm">
        <h2 className="text-[15px] font-semibold text-black">Адреса</h2>
        <div className="mt-2 space-y-2">
          {addresses.length === 0 ? (
            <p className="rounded-2xl bg-[#f4f6fb] p-4 text-center text-[13px] text-slate-500">
              Адреса не сохранены
            </p>
          ) : (
            addresses.map((address) => (
              <div key={address.id} className="rounded-2xl bg-[#f4f6fb] p-3 text-[13px] text-black">
                {getAddressLabel(address)}
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
