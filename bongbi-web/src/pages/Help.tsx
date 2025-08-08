import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Book,
  Mail,
  Video,
} from "lucide-react";

const Help = () => {

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            도움말 및 지원
          </h1>
          <p className="text-muted-foreground">
            봉비서 사용법을 확인하거나 문의를 남겨 주세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                고객 지원 문의
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <Input id="name" placeholder="이름을 입력하세요" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@company.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">제목</Label>
                  <Input id="subject" placeholder="어떤 도움이 필요하신가요?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">메시지</Label>
                  <Textarea
                    id="message"
                    placeholder="문제나 질문을 상세히 설명해 주세요..."
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full">
                  메시지 보내기
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  바로가기
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  동영상 튜토리얼
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Book className="h-4 w-4 mr-2" />
                  사용자 매뉴얼
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>연락처 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">이메일 지원</p>
                    <p className="text-sm text-muted-foreground">
                      tj11629@naver.com
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Help;
