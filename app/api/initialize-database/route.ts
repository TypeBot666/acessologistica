import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createClient()

    // Passo 1: Testar conexão básica com o banco de dados usando uma consulta simples
    console.log("Testando conexão com o banco de dados...")

    try {
      // Usando uma consulta SQL direta em vez de acessar pg_catalog
      const { data: testData, error: testError } = await supabase.sql(`SELECT 1 as connection_test`)

      if (testError) {
        console.error("Erro na conexão básica:", testError)
        return NextResponse.json(
          {
            success: false,
            message: "Erro na conexão com o banco de dados",
            error: testError.message,
          },
          { status: 500 },
        )
      }

      console.log("Conexão com o banco de dados estabelecida com sucesso")
    } catch (e) {
      console.error("Erro ao testar conexão:", e)

      // Tentar uma abordagem alternativa
      try {
        const { data, error } = await supabase.from("auth_users").select("id").limit(1)
        if (error) {
          return NextResponse.json(
            {
              success: false,
              message: "Erro na conexão com o banco de dados",
              error: error.message,
            },
            { status: 500 },
          )
        }
      } catch (altError) {
        return NextResponse.json(
          {
            success: false,
            message: "Erro na conexão com o banco de dados",
            error: altError instanceof Error ? altError.message : String(altError),
          },
          { status: 500 },
        )
      }
    }

    // Passo 2: Criar a tabela system_settings diretamente com SQL bruto
    console.log("Criando tabela system_settings...")

    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS system_settings (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Habilitar RLS
    ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
    
    -- Criar políticas de acesso
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens'
      ) THEN
        CREATE POLICY "Rubens" ON system_settings 
        AS PERMISSIVE FOR SELECT TO public 
        USING (true);
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens_insert'
      ) THEN
        CREATE POLICY "Rubens_insert" ON system_settings 
        AS PERMISSIVE FOR INSERT TO public 
        WITH CHECK (true);
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens_update'
      ) THEN
        CREATE POLICY "Rubens_update" ON system_settings 
        AS PERMISSIVE FOR UPDATE TO public 
        USING (true);
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens_delete'
      ) THEN
        CREATE POLICY "Rubens_delete" ON system_settings 
        AS PERMISSIVE FOR DELETE TO public 
        USING (true);
      END IF;
    END
    $$;
    `

    try {
      // Executar SQL diretamente
      const { error: sqlError } = await supabase.sql(createTableSQL)

      if (sqlError) {
        console.error("Erro ao criar tabela via SQL direto:", sqlError)

        // Tentar método alternativo
        try {
          // Tentativa alternativa usando várias consultas menores
          await supabase.sql(`
            CREATE TABLE IF NOT EXISTS system_settings (
              id SERIAL PRIMARY KEY,
              key TEXT NOT NULL UNIQUE,
              value JSONB NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
          `)

          await supabase.sql(`ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY`)

          // Verificar se a política já existe antes de criar
          await supabase.sql(`
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens') THEN
                CREATE POLICY "Rubens" ON system_settings AS PERMISSIVE FOR SELECT TO public USING (true);
              END IF;
            END
            $$
          `)

          await supabase.sql(`
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens_insert') THEN
                CREATE POLICY "Rubens_insert" ON system_settings AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
              END IF;
            END
            $$
          `)

          await supabase.sql(`
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens_update') THEN
                CREATE POLICY "Rubens_update" ON system_settings AS PERMISSIVE FOR UPDATE TO public USING (true);
              END IF;
            END
            $$
          `)

          await supabase.sql(`
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens_delete') THEN
                CREATE POLICY "Rubens_delete" ON system_settings AS PERMISSIVE FOR DELETE TO public USING (true);
              END IF;
            END
            $$
          `)
        } catch (splitSqlError) {
          console.error("Erro ao executar SQL dividido:", splitSqlError)
        }
      }

      console.log("Tabela system_settings criada ou já existente")
    } catch (e) {
      console.error("Erro ao criar tabela system_settings:", e)
    }

    // Passo 3: Inserir configurações padrão
    console.log("Inserindo configurações padrão...")

    const defaultSettings = {
      enabled: true,
      steps: [
        { status: "Objeto postado", days: 0, emailTime: "08:00" },
        { status: "Em processo de triagem", days: 1, emailTime: "09:00" },
        { status: "Em trânsito para o centro de distribuição", days: 3, emailTime: "10:00" },
        { status: "No centro de distribuição", days: 5, emailTime: "11:00" },
        { status: "Em rota de entrega", days: 7, emailTime: "12:00" },
        { status: "Entregue com sucesso", days: 8, emailTime: "13:00" },
      ],
      finalStatus: "Entregue com sucesso",
      emailNotifications: true,
      executionTime: "08:00",
      lastExecution: null,
    }

    try {
      const { error: insertError } = await supabase.from("system_settings").upsert(
        {
          key: "automation_settings",
          value: defaultSettings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      )

      if (insertError) {
        console.error("Erro ao inserir configurações padrão:", insertError)

        // Tentativa alternativa usando SQL direto
        try {
          const settingsJson = JSON.stringify(defaultSettings)
          await supabase.sql(`
            INSERT INTO system_settings (key, value, updated_at) 
            VALUES ('automation_settings', '${settingsJson}'::jsonb, NOW())
            ON CONFLICT (key) DO UPDATE 
            SET value = '${settingsJson}'::jsonb, updated_at = NOW()
          `)
        } catch (sqlInsertError) {
          console.error("Erro ao inserir configurações via SQL:", sqlInsertError)
        }
      }

      console.log("Configurações padrão inseridas com sucesso ou já existentes")
    } catch (e) {
      console.error("Erro ao inserir configurações padrão:", e)
    }

    // Passo 4: Criar tabela automation_settings para relatórios
    console.log("Criando tabela automation_settings...")

    try {
      await supabase.sql(`
        CREATE TABLE IF NOT EXISTS automation_settings (
          id SERIAL PRIMARY KEY,
          status TEXT NOT NULL,
          days_after INTEGER NOT NULL,
          email_time TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Habilitar RLS
        ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas de acesso básicas
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Rubens') THEN
            CREATE POLICY "Rubens" ON automation_settings AS PERMISSIVE FOR SELECT TO public USING (true);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Rubens_insert') THEN
            CREATE POLICY "Rubens_insert" ON automation_settings AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Rubens_update') THEN
            CREATE POLICY "Rubens_update" ON automation_settings AS PERMISSIVE FOR UPDATE TO public USING (true);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Rubens_delete') THEN
            CREATE POLICY "Rubens_delete" ON automation_settings AS PERMISSIVE FOR DELETE TO public USING (true);
          END IF;
        END
        $$;
      `)

      console.log("Tabela automation_settings criada com sucesso ou já existente")
    } catch (e) {
      console.error("Erro ao criar tabela automation_settings:", e)
    }

    // Passo 5: Inserir dados na tabela automation_settings
    console.log("Inserindo dados na tabela automation_settings...")

    try {
      // Limpar tabela primeiro
      await supabase.from("automation_settings").delete().gt("id", 0)

      // Inserir dados
      for (const step of defaultSettings.steps) {
        const { error } = await supabase.from("automation_settings").insert({
          status: step.status,
          days_after: step.days,
          email_time: step.emailTime || "08:00",
        })

        if (error) {
          console.error("Erro ao inserir dados na tabela automation_settings:", error)
        }
      }

      console.log("Dados inseridos na tabela automation_settings com sucesso")
    } catch (e) {
      console.error("Erro ao inserir dados na tabela automation_settings:", e)
    }

    // Passo 6: Criar tabela scheduled_emails
    console.log("Criando tabela scheduled_emails...")

    try {
      await supabase.sql(`
        CREATE TABLE IF NOT EXISTS scheduled_emails (
          id SERIAL PRIMARY KEY,
          tracking_code TEXT NOT NULL,
          email TEXT NOT NULL,
          status TEXT NOT NULL,
          scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
          sent BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Habilitar RLS
        ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas de acesso básicas
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_emails' AND policyname = 'Rubens') THEN
            CREATE POLICY "Rubens" ON scheduled_emails AS PERMISSIVE FOR SELECT TO public USING (true);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_emails' AND policyname = 'Rubens_insert') THEN
            CREATE POLICY "Rubens_insert" ON scheduled_emails AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_emails' AND policyname = 'Rubens_update') THEN
            CREATE POLICY "Rubens_update" ON scheduled_emails AS PERMISSIVE FOR UPDATE TO public USING (true);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_emails' AND policyname = 'Rubens_delete') THEN
            CREATE POLICY "Rubens_delete" ON scheduled_emails AS PERMISSIVE FOR DELETE TO public USING (true);
          END IF;
        END
        $$;
      `)

      console.log("Tabela scheduled_emails criada com sucesso ou já existente")
    } catch (e) {
      console.error("Erro ao criar tabela scheduled_emails:", e)
    }

    // Verificar se as tabelas foram criadas
    const tables = {
      system_settings: false,
      automation_settings: false,
      scheduled_emails: false,
    }

    try {
      // Tentamos verificar as tabelas criadas com uma única consulta SQL
      const { data, error } = await supabase.sql(`
        SELECT tablename
        FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('system_settings', 'automation_settings', 'scheduled_emails')
      `)

      if (!error && data) {
        // Processa os resultados
        for (const row of data) {
          if (row.tablename === "system_settings") tables.system_settings = true
          if (row.tablename === "automation_settings") tables.automation_settings = true
          if (row.tablename === "scheduled_emails") tables.scheduled_emails = true
        }
      }
    } catch (e) {
      console.error("Erro ao verificar tabelas criadas:", e)

      // Abordagem alternativa: verificar cada tabela individualmente
      try {
        const checkSystemSettings = await supabase.from("system_settings").select("id").limit(1)
        tables.system_settings = !checkSystemSettings.error

        const checkAutomationSettings = await supabase.from("automation_settings").select("id").limit(1)
        tables.automation_settings = !checkAutomationSettings.error

        const checkScheduledEmails = await supabase.from("scheduled_emails").select("id").limit(1)
        tables.scheduled_emails = !checkScheduledEmails.error
      } catch (altError) {
        console.error("Erro na verificação alternativa:", altError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Inicialização do banco de dados concluída",
      tables,
    })
  } catch (error) {
    console.error("Erro na inicialização do banco de dados:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro na inicialização do banco de dados",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
