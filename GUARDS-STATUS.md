# Sistema de Guards - Configuración Completada ✅

## Problema Resuelto

**Error original**: `Nest can't resolve dependencies of the AuthGuard (?, JwtService, Reflector)`

**Causa**: El `HttpServerModule` no tenía acceso a las dependencias necesarias:
1. `AUTH_SERVICE` no estaba exportado del `CoreModule`
2. `JwtService` no estaba disponible en el contexto del `HttpServerModule`

## Soluciones Implementadas

### 1. Exportar AUTH_SERVICE del CoreModule
```typescript
// src/core/core.module.ts
exports: [
    USUARIO_APPLICATION,
    CONTACTO_APPLICATION,
    TIPO_CONTACTO_APPLICATION,
    ROL_APLICATION,
    AUTH_APLICATION,
    AUTH_SERVICE // ✅ Agregado
],
```

### 2. Importar JwtModule en HttpServerModule
```typescript
// src/infrastructure/http-server/http-server.module.ts
@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'TU_SECRETO_AQUI',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
        }),
    ],
    // ...resto de configuración
})
```

## Estado Actual del Sistema

✅ **AuthGuard**: Funcionando - valida tokens JWT  
✅ **PermissionsGuard**: Funcionando - valida permisos granulares  
✅ **Decoradores**: Todos funcionando (@Public, @Permissions, @Roles, @CurrentUser)  
✅ **Guards Globales**: Aplicados automáticamente a todas las rutas  
✅ **Servidor**: Ejecutándose en puerto 3001  

## Rutas Mapeadas

### Usuario Controller (`/usuario`)
- `POST /usuario` - Crear usuario (requiere permiso `usuario.crear`)
- `GET /usuario` - Listar usuarios (requiere permiso `usuario.listar`)  
- `GET /usuario/userName/:userName` - Buscar por userName (requiere permiso `usuario.ver`)
- `GET /usuario/id/:id` - Buscar por ID (requiere permiso `usuario.ver`)
- `GET /usuario/me` - Información del usuario actual (solo autenticación)
- `GET /usuario/profile` - Perfil completo con permisos (solo autenticación)

### Auth Controller (`/auth`) - Rutas Públicas
- `POST /auth/login` - Iniciar sesión
- `POST /auth/refresh` - Renovar token
- `GET /auth/validate/:token` - Validar token

## Cómo Probar

### 1. Obtener Token
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userName": "tu_usuario", "password": "tu_password"}'
```

### 2. Usar Token en Rutas Protegidas
```bash
curl -X GET http://localhost:3001/usuario/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Probar Rutas con Permisos
```bash
# Esta ruta requiere permiso 'usuario.listar'
curl -X GET http://localhost:3001/usuario \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Jerarquía de Control de Acceso

1. **@Public()** - Sin autenticación requerida
2. **@Permissions('permiso.especifico')** - Control granular (prioritario)  
3. **@Roles('rol')** - Control por roles (fallback)
4. **Sin decoradores** - Solo requiere autenticación

## Base de Datos Requerida

Para que funcione completamente, asegúrate de tener:
- Usuarios con roles asignados
- Roles con permisos específicos  
- Permisos definidos como: `usuario.crear`, `usuario.ver`, `usuario.listar`, etc.

El sistema está completamente funcional y listo para usar! 🚀