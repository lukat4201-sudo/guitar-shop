import React, { useMemo, useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, gql, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import { Search, Guitar, ChevronRight, ChevronLeft, Globe, Loader2 } from "lucide-react";



// ---------------------------
// i18n (English + Macedonian)
// ---------------------------
const messages = {
  en: {
    title: "Online Guitar Shop",
    brands: "Guitar Brands",
    viewModels: "View models",
    models: "Guitar Models",
    searchPlaceholder: "Search models...",
    typeFilter: "Type",
    allTypes: "All types",
    loading: "Loading...",
    error: "Something went wrong",
    back: "Back",
    details: "Details",
    specs: "Specs",
    musicians: "Musicians",
    showMore: "Show more",
    noResults: "No results",
    language: "Language",
  },
  mk: {
    title: "Онлајн Гитар Продавница",
    brands: "Брендови на гитари",
    viewModels: "Види модели",
    models: "Модели на гитари",
    searchPlaceholder: "Пребарај модели...",
    typeFilter: "Тип",
    allTypes: "Сите типови",
    loading: "Се вчитува...",
    error: "Нешто тргна наопаку",
    back: "Назад",
    details: "Детали",
    specs: "Спецификации",
    musicians: "Музичари",
    showMore: "Повеќе",
    noResults: "Нема резултати",
    language: "Јазик",
  },
};

const I18nCtx = createContext({ lang: "en", t: (k) => messages.en[k] ?? k, setLang: () => {} });
const useI18n = () => useContext(I18nCtx);

function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");
  useEffect(() => localStorage.setItem("lang", lang), [lang]);
  const t = (k) => messages[lang]?.[k] ?? k;
  const value = useMemo(() => ({ lang, setLang, t }), [lang]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

// ---------------------------
// Apollo client
// ---------------------------
const client = new ApolloClient({
  link: new HttpLink({ uri: "https://graphql-api-brown.vercel.app/api/graphql" }),
  cache: new InMemoryCache(),
});

// ---------------------------
// QUERIES (adjust if schema differs)
// ---------------------------
const GET_BRANDS = gql`
  query GetBrands {
    brands {
      id
      name
      logo
    }
  }
`;

const GET_MODELS_BY_BRAND = gql`
  query GetModelsByBrand($brandId: ID!, $search: String, $type: String, $offset: Int, $limit: Int) {
    brand(id: $brandId) {
      id
      name
      models(search: $search, type: $type, offset: $offset, limit: $limit) {
        id
        name
        type
        image
      }
      modelTypes
    }
  }
`;

const GET_GUITAR = gql`
  query GetGuitar($id: ID!) {
    guitar(id: $id) {
      id
      name
      brand { id name }
      type
      image
      specs { key value }
      musicians { id name photo }
    }
  }
`;

// ---------------------------
// UI helpers
// ---------------------------
function Page({ title, children, backTo }) {
  const { t } = useI18n();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          {backTo && (
            <button onClick={() => (typeof backTo === "string" ? nav(backTo) : nav(-1))} className="p-2 rounded-xl hover:bg-neutral-100">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <Guitar className="w-5 h-5 mr-1" />
          <h1 className="font-semibold">{t(title)}</h1>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="border-t border-neutral-200 text-sm text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span className="mr-2">{t("language")}:</span>
          <LanguageSwitcher inline />
          <span className="ml-auto">{new Date().getFullYear()} • {t("title")}</span>
        </div>
      </footer>
    </div>
  );
}

function LanguageSwitcher({ inline = false }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`flex items-center gap-1 ${inline ? "" : "border rounded-xl p-1 bg-neutral-50"}`}>
      {["en", "mk"].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 rounded-lg text-sm ${lang === l ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Loader() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 text-neutral-500">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{t("loading")}</span>
    </div>
  );
}

function ErrorBox({ message }) {
  const { t } = useI18n();
  return (
    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800">
      {t("error")} {message ? `– ${message}` : ""}
    </div>
  );
}

// ---------------------------
// PAGE 1 — Brands
// ---------------------------
function BrandsPage() {
  const { t } = useI18n();
  const { data, loading, error } = useQuery(GET_BRANDS);

  if (loading) return (
    <Page title="brands">
      <Loader />
    </Page>
  );
  if (error) return (
    <Page title="brands">
      <ErrorBox message={error.message} />
    </Page>
  );

  const brands = data?.brands ?? [];

  return (
    <Page title="brands">
      {brands.length === 0 ? (
        <p className="text-neutral-500">{t("noResults")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {brands.map((b) => (
            <Link to={`/brand/${b.id}`} key={b.id} className="group">
              <motion.div whileHover={{ y: -2 }} className="rounded-2xl border p-4 bg-white shadow-sm hover:shadow-md transition">
                <div className="aspect-[4/3] rounded-xl bg-neutral-100 flex items-center justify-center overflow-hidden">
                  {b.logo ? (
                    <img src={b.logo} alt={b.name} className="object-contain w-full h-full" />
                  ) : (
                    <Guitar className="w-10 h-10 text-neutral-400" />
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="font-medium">{b.name}</div>
                  <span className="text-sm text-neutral-500 flex items-center gap-1">
                    {t("viewModels")} <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}

// ---------------------------
// PAGE 2 — Models for a brand (search, filter, infinite scroll)
// ---------------------------
function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function ModelsPage() {
  const { t } = useI18n();
  const { brandId } = useParams();
  const nav = useNavigate();
  const qp = useQueryParams();

  const [searchText, setSearchText] = useState(qp.get("q") || "");
  const [type, setType] = useState(qp.get("type") || "");

  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState([]);
  const LIMIT = 12;

  const { data, loading, error, fetchMore, refetch } = useQuery(GET_MODELS_BY_BRAND, {
    variables: { brandId, search: searchText || null, type: type || null, offset: 0, limit: LIMIT },
    notifyOnNetworkStatusChange: true,
  });

  const brand = data?.brand;
  const models = data?.brand?.models ?? [];
  const types = data?.brand?.modelTypes ?? [];

  useEffect(() => {
    // reset on brand or filters change
    setItems([]);
    setOffset(0);
  }, [brandId, searchText, type]);

  useEffect(() => {
    if (models && offset === 0) setItems(models);
  }, [models, offset]);

  // infinite scroll handler
  useEffect(() => {
    function onScroll() {
      if (loading) return;
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
      if (nearBottom) {
        fetchMore({
          variables: { brandId, search: searchText || null, type: type || null, offset: items.length, limit: LIMIT },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) return prev;
            const more = fetchMoreResult?.brand?.models ?? [];
            setItems((old) => [...old, ...more]);
            return fetchMoreResult; // value doesn't matter since we push into local items
          },
        });
      }
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, items.length, brandId, searchText, type, fetchMore]);

  function applyFilters(e) {
    e?.preventDefault?.();
    const params = new URLSearchParams();
    if (searchText) params.set("q", searchText);
    if (type) params.set("type", type);
    nav({ search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
    refetch({ brandId, search: searchText || null, type: type || null, offset: 0, limit: LIMIT });
  }

  return (
    <Page title="models" backTo="/">
      {loading && items.length === 0 && <Loader />}
      {error && <ErrorBox message={error.message} />}

      {brand && (
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => nav(-1)} className="p-2 rounded-xl hover:bg-neutral-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">{brand.name}</h2>
        </div>
      )}

      {/* Search + Filter */}
      <form onSubmit={applyFilters} className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2">
          <Search className="w-4 h-4" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full outline-none"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-2xl border bg-white px-3 py-2">
          <option value="">{t("allTypes")}</option>
          {types?.map((tp) => (
            <option key={tp} value={tp}>{tp}</option>
          ))}
        </select>
        <button type="submit" className="rounded-2xl bg-neutral-900 text-white px-4 py-2 font-medium hover:opacity-90">
          Apply
        </button>
      </form>

      {/* Models grid */}
      {items.length === 0 && !loading ? (
        <p className="text-neutral-500">{t("noResults")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((m) => (
            <Link to={`/guitar/${m.id}`} key={m.id} className="group">
              <motion.div whileHover={{ y: -2 }} className="rounded-2xl border p-3 bg-white shadow-sm hover:shadow-md transition">
                <div className="aspect-[4/3] rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center">
                  {m.image ? (
                    <img src={m.image} alt={m.name} className="object-cover w-full h-full" />
                  ) : (
                    <Guitar className="w-10 h-10 text-neutral-400" />)
                  }
                </div>
                <div className="mt-2">
                  <div className="font-medium leading-tight line-clamp-2">{m.name}</div>
                  <div className="text-sm text-neutral-500">{m.type}</div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      {loading && items.length > 0 && (
        <div className="flex justify-center mt-4"><Loader /></div>
      )}
    </Page>
  );
}

// ---------------------------
// PAGE 3 — Guitar Details (tabs; musicians show 2 at a time)
// ---------------------------
function Tabs({ tabs, current, onChange }) {
  return (
    <div className="flex gap-2 border-b">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`px-4 py-2 -mb-px border-b-2 ${current === t.key ? "border-neutral-900 font-medium" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function GuitarDetailsPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const nav = useNavigate();
  const { data, loading, error } = useQuery(GET_GUITAR, { variables: { id } });

  if (loading) return (
    <Page title="details" backTo={-1}>
      <Loader />
    </Page>
  );
  if (error) return (
    <Page title="details" backTo={-1}>
      <ErrorBox message={error.message} />
    </Page>
  );

  const g = data?.guitar;
  if (!g) return (
    <Page title="details" backTo={-1}>
      <p className="text-neutral-500">{t("noResults")}</p>
    </Page>
  );

  const [tab, setTab] = useState("specs");
  // use state inside effect-less render by moving into component
  return (
    <Page title="details" backTo={-1}>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => nav(-1)} className="p-2 rounded-xl hover:bg-neutral-100">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-xl font-semibold">{g.name}</div>
        <span className="text-neutral-500">• {g.brand?.name} • {g.type}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-white p-3">
          <div className="aspect-[4/3] rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center">
            {g.image ? <img src={g.image} alt={g.name} className="object-cover w-full h-full" /> : <Guitar className="w-10 h-10 text-neutral-400" />}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-3">
          <Tabs
            tabs={[{ key: "specs", label: t("specs") }, { key: "musicians", label: t("musicians") }]}
            current={tab}
            onChange={setTab}
          />

          {tab === "specs" ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(g.specs ?? []).map((s, i) => (
                <div key={i} className="rounded-xl border p-3 bg-neutral-50">
                  <div className="text-xs text-neutral-500">{s.key}</div>
                  <div className="font-medium">{s.value}</div>
                </div>
              ))}
              {(!g.specs || g.specs.length === 0) && (
                <p className="text-neutral-500">{t("noResults")}</p>
              )}
            </div>
          ) : (
            <MusiciansList list={g.musicians ?? []} />
          )}
        </div>
      </div>
    </Page>
  );
}

function MusiciansList({ list }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(2);
  const canShowMore = visible < list.length;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {list.slice(0, visible).map((m) => (
          <div key={m.id ?? m.name} className="rounded-xl border p-3 flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center">
              {m.photo ? <img src={m.photo} alt={m.name} className="object-cover w-full h-full" /> : <Guitar className="w-6 h-6 text-neutral-400" />}
            </div>
            <div>
              <div className="font-medium">{m.name}</div>
              {m.band && <div className="text-sm text-neutral-500">{m.band}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* dots/buttons to reveal +2 */}
      <div className="mt-4 flex items-center gap-2">
        {Array.from({ length: Math.ceil(list.length / 2) }).map((_, i) => (
          <button key={i} onClick={() => setVisible(Math.min((i + 1) * 2, list.length))}
            className={`w-2.5 h-2.5 rounded-full ${visible >= (i + 1) * 2 ? "bg-neutral-900" : "bg-neutral-300"}`}
            aria-label={`show ${(i + 1) * 2}`}
          />
        ))}
        {canShowMore && (
          <button onClick={() => setVisible((v) => Math.min(v + 2, list.length))} className="ml-2 text-sm px-3 py-1 rounded-xl border">
            {t("showMore")}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------
// Root
// ---------------------------
export default function App() {
  return (
    <ApolloProvider client={client}>
      <I18nProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<BrandsPage />} />
            <Route path="/brand/:brandId" element={<ModelsPage />} />
            <Route path="/guitar/:id" element={<GuitarDetailsPage />} />
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </ApolloProvider>
  );
}

