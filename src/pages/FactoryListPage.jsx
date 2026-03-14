import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppLayout from "../components/AppLayout";
import { useDeviceType } from "../hooks/useDeviceType";
import { colors, spacing } from "../constants/designTokens";
import { getDisplayFactoryName } from "../lib/factoryNames";

function FactoryListPage() {
  const [factories, setFactories] = useState([]);
  const navigate = useNavigate();
  const device = useDeviceType();
  const isMobile = device === "mobile";
  const isDesktop = device === "desktop";
  const { t } = useTranslation();

  useEffect(() => {
    fetchFactories();
  }, []);

  async function fetchFactories() {
    const { data, error } = await supabase
      .from("factories")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setFactories(data);
  }

  return (
    <AppLayout>
      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
        paddingBottom: spacing.md,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isDesktop ? '1.5rem' : '1.2rem', fontWeight: '700', color: colors.darkText }}>
            {t('factories')}
          </h2>
          <p style={{ margin: `4px 0 0 0`, fontSize: '0.85rem', color: colors.lightText }}>
            {factories.length} {factories.length === 1 ? t('factory_found_single') : t('factories_found')}
          </p>
        </div>
      </div>

      {/* Factory grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile
          ? '1fr'
          : isDesktop
            ? 'repeat(auto-fill, minmax(300px, 1fr))'
            : 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: spacing.lg,
      }}>
        {factories.map((factory) => (
          <div
            key={factory.id}
            onClick={() => navigate(`/factory/${factory.id}`)}
            style={{
              backgroundColor: colors.white,
              borderRadius: '12px',
              padding: isDesktop ? spacing.xl : spacing.lg,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
              transition: '150ms ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Icon + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <div style={{
                width: isDesktop ? '48px' : '40px',
                height: isDesktop ? '48px' : '40px',
                backgroundColor: '#EFF6FF',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isDesktop ? '1.4rem' : '1.2rem',
                flexShrink: 0,
              }}>🏭</div>
              <h3 style={{
                margin: 0,
                fontSize: isDesktop ? '1.1rem' : '1rem',
                fontWeight: '700',
                color: colors.darkText,
              }}>
                {getDisplayFactoryName(factory.name)}
              </h3>
            </div>

            {/* Details */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingLeft: isDesktop ? '64px' : '56px',
            }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: colors.lightText }}>
                📋 {t('code')}: <strong style={{ color: colors.mediumText }}>{factory.code}</strong>
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: colors.lightText }}>
                📍 {factory.location}
              </p>
            </div>

            {/* Arrow */}
            <div style={{
              marginTop: spacing.sm,
              display: 'flex',
              justifyContent: 'flex-end',
              color: colors.primary,
              fontSize: '0.85rem',
              fontWeight: '600',
            }}>
              {t('view_details')} →
            </div>
          </div>
        ))}
      </div>

      {factories.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: spacing.xl,
          color: colors.lightText,
          fontSize: '0.9rem',
        }}>
          {t('no_factories')}
        </div>
      )}
    </AppLayout>
  );
}

export default FactoryListPage;