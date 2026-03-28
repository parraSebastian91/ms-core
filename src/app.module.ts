
import { Module } from '@nestjs/common';
import { InfraestructureModule } from './infrastructure/Infraestructure.module';
import { CoreModule } from './core/core.module';
import { UsuarioRepositoryAdapter } from './infrastructure/adapter/usuarioRepository.adapter';
import { ConfigModule } from '@nestjs/config';
import { ContactoRepositoryAdapter } from './infrastructure/adapter/contactoRepository.adapter';
import { TipoContactoRepositoryAdapter } from './infrastructure/adapter/tipoContactoRepository.adapter';
import { RolRepositoryAdapter } from './infrastructure/adapter/rolRepository.adapter';
import { JwtModule } from '@nestjs/jwt';
import { SistemaRepositoryAdapter } from './infrastructure/adapter/sistemaRepository.adapter';
import configurations from 'config/configurations';

@Module({
  imports: [
    InfraestructureModule,
    ConfigModule.forRoot({
      load: [configurations],
      isGlobal: true,
      envFilePath: ['.env','.env.container'],
    }),
    CoreModule.register({
      modules: [InfraestructureModule],
      adapters: {
        usuarioRepository: UsuarioRepositoryAdapter,
        contactoRepository: ContactoRepositoryAdapter,
        tipoContactoRepository: TipoContactoRepositoryAdapter,
        rolRepository: RolRepositoryAdapter,
        sistemaRepository: SistemaRepositoryAdapter
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'TU_SECRETO_AQUI',
      signOptions: { expiresIn: '1h' },
    }),
  ]
})
export class AppModule { }
